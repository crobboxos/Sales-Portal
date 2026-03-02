// ============================================================================
// ProductMergeService
// ============================================================================
// Assumptions:
// 1) "Product" refers to the standard Product2 object.
// 2) Duplicate criteria: same non-blank ProductCode.
// 3) For a given ProductCode the oldest Product2 (earliest CreatedDate) is
//    retained; all others with that ProductCode are treated as duplicates.
// 4) "Related data" means any child record with a direct lookup or master-detail
//    field to Product2 where the foreign key is updateable. These are discovered
//    at runtime using Schema.describe() and are re-parented to the retained
//    Product where possible.
// 5) This class is intended as a generic framework. In a real org you may want to:
//      - Restrict which child objects are handled (e.g., only custom objects,
//        PricebookEntry, Asset, etc.).
//      - Add additional filters (e.g., only Active products, certain record types).
// 6) This code does NOT attempt to deduplicate indirect references (such as
//    OpportunityLineItem that references PricebookEntry which in turn references
//    Product2). It only re-parents records that look up directly to Product2.
// ============================================================================

public with sharing class ProductMergeService {

    // ----------------------------------------------------------------------
    // Result wrapper class to report what happened during a merge run.
    // ----------------------------------------------------------------------
    public class MergeResult {
        /** All input Product2 Ids that were considered. */
        public Set<Id> inputProductIds       = new Set<Id>();
        /** Ids of the Products that were chosen as retained/master records. */
        public Set<Id> retainedProductIds    = new Set<Id>();
        /** Ids of the Products that were successfully deleted as duplicates. */
        public Set<Id> deletedDuplicateIds   = new Set<Id>();
        /** User-readable messages for any problems encountered. */
        public List<String> errors           = new List<String>();
    }

    // ----------------------------------------------------------------------
    // PUBLIC ENTRY POINT
    // ----------------------------------------------------------------------
    /**
     * Merges duplicate Product2 records by ProductCode.
     *
     * Behavior:
     *  - Groups Products by ProductCode (ignoring blank ProductCode).
     *  - For each ProductCode with more than one record:
     *      - Chooses the oldest Product (earliest CreatedDate) as the master.
     *      - Treats all other Products with that ProductCode as duplicates.
     *  - Re-parents child records from duplicates to the master where possible.
     *  - Attempts to delete duplicate Product2 records (allOrNone = false).
     *
     * Error handling:
     *  - Uses Database.update/delete with allOrNone = false to avoid blocking
     *    the entire merge if some records fail due to dependencies or sharing.
     *  - Any errors are collected in MergeResult.errors.
     *
     * @param productIds List of Product2 Ids to inspect for duplicates.
     * @return MergeResult describing what was done and any issues found.
     */
    public static MergeResult mergeDuplicatesByProductCode(List<Id> productIds) {
        MergeResult result = new MergeResult();

        if (productIds == null || productIds.isEmpty()) {
            return result; // nothing to do
        }

        result.inputProductIds.addAll(productIds);

        // 1) Load the input Products.
        Map<Id, Product2> inputProductsById = new Map<Id, Product2>(
            [
                SELECT Id, Name, ProductCode, CreatedDate
                FROM Product2
                WHERE Id IN :productIds
            ]
        );

        if (inputProductsById.isEmpty()) {
            return result;
        }

        // 2) Collect non-blank ProductCodes from the inputs.
        Set<String> productCodes = new Set<String>();
        for (Product2 p : inputProductsById.values()) {
            if (p.ProductCode != null && p.ProductCode.trim().length() > 0) {
                productCodes.add(p.ProductCode.trim());
            }
        }

        if (productCodes.isEmpty()) {
            // None of the supplied products have a ProductCode; no duplicates by this logic.
            return result;
        }

        // 3) Fetch ALL Products with those ProductCodes (not just the input Ids)
        //    so we can consider the full duplicate groups.
        List<Product2> productsForCodes = [
            SELECT Id, Name, ProductCode, CreatedDate
            FROM Product2
            WHERE ProductCode IN :productCodes
            ORDER BY ProductCode, CreatedDate ASC
        ];

        // 4) Group by ProductCode (already sorted by CreatedDate).
        Map<String, List<Product2>> productsByCode = new Map<String, List<Product2>>();
        for (Product2 p : productsForCodes) {
            if (!productsByCode.containsKey(p.ProductCode)) {
                productsByCode.put(p.ProductCode, new List<Product2>());
            }
            productsByCode.get(p.ProductCode).add(p);
        }

        // 5) Determine masters and duplicates.
        //    productIdToMasterId will contain only duplicate Ids as keys.
        Map<Id, Id> productIdToMasterId = new Map<Id, Id>();

        for (String code : productsByCode.keySet()) {
            List<Product2> groupProduct = productsByCode.get(code);
            if (groupProduct == null || groupProduct.size() <= 1) {
                // Only one Product with this ProductCode; nothing to merge.
                continue;
            }

            // Oldest Product is the master (due to ORDER BY CreatedDate ASC).
            Product2 master = groupProduct[0];
            result.retainedProductIds.add(master.Id);

            // All later entries in the group are duplicates.
            for (Integer i = 1; i < groupProduct.size(); i++) {
                Product2 duplicate = groupProduct[i];
                productIdToMasterId.put(duplicate.Id, master.Id);
            }
        }

        if (productIdToMasterId.isEmpty()) {
            // No duplicates were found.
            return result;
        }

        // 6) Re-parent child records from duplicates to masters.
        try {
            reparentChildRecords(productIdToMasterId, result);
        } catch (Exception ex) {
            // Catch-all to keep the process going; details logged in errors.
            result.errors.add('Unexpected error while re-parenting children: ' + ex.getMessage());
        }

        // 7) Delete duplicates (best-effort).
        try {
            deleteDuplicateProducts(productIdToMasterId.keySet(), result);
        } catch (Exception ex) {
            result.errors.add('Unexpected error while deleting duplicate Products: ' + ex.getMessage());
        }

        return result;
    }

    // ----------------------------------------------------------------------
    // PRIVATE: RE-PARENT CHILD RECORDS
    // ----------------------------------------------------------------------
    /**
     * Re-parents child records whose Product lookup references a duplicate
     * Product2 Id to the appropriate master Product2 Id.
     *
     * Implementation details:
     *  - Uses Schema.describe() to find all child relationships of Product2
     *    where the foreign key field is updateable.
     *  - For each such child object, issues a SOQL query to find records where
     *    the lookup field points to a duplicate Product2.
     *  - Updates those records to point to the master Product2.
     *
     * Limitations:
     *  - Only handles direct lookups/master-detail to Product2.
     *  - Does not handle polymorphic relationships or indirect references.
     *
     * @param productIdToMasterId  Map of duplicate Product2 Id -> master Product2 Id.
     * @param result               MergeResult to record any errors.
     */
    private static void reparentChildRecords(Map<Id, Id> productIdToMasterId, MergeResult result) {
        if (productIdToMasterId.isEmpty()) {
            return;
        }

        Schema.DescribeSObjectResult productDescribe = Product2.SObjectType.getDescribe();
        List<Schema.ChildRelationship> childRelationships = productDescribe.getChildRelationships();

        Set<Id> duplicateIds = productIdToMasterId.keySet();

        for (Schema.ChildRelationship cr : childRelationships) {
            // Skip relationships where the foreign key is not updateable or missing.
            if (cr.getField() == null || !cr.getField().getDescribe().isUpdateable()) {
                continue;
            }

            Schema.SObjectType childType = cr.getChildSObject();
            Schema.DescribeSObjectResult childDescribe = childType.getDescribe();
            String childObjectName = childDescribe.getName();
            String fkFieldName     = cr.getField().getDescribe().getName();

            // Skip child objects the current user cannot access.
            if (!childDescribe.isAccessible()) {
                continue;
            }

            // Build dynamic SOQL to find records referencing duplicate Product2 Ids.
            String soql =
                'SELECT Id, ' + fkFieldName +
                ' FROM ' + childObjectName +
                ' WHERE ' + fkFieldName + ' IN :duplicateIds';

            List<SObject> children;
            try {
                children = Database.query(soql);
            } catch (QueryException qe) {
                // If we cannot query a given child object, log and move on.
                result.errors.add('Query failed for child object ' + childObjectName +
                                  ': ' + qe.getMessage());
                continue;
            }

            if (children.isEmpty()) {
                continue;
            }

            // Re-parent to the appropriate master.
            for (SObject child : children) {
                Id oldProductId = (Id) child.get(fkFieldName);
                Id newMasterId  = productIdToMasterId.get(oldProductId);
                if (newMasterId != null) {
                    child.put(fkFieldName, newMasterId);
                }
            }

            // Best-effort update (allOrNone = false).
            Database.SaveResult[] saveResults = Database.update(children, false);
            for (Integer i = 0; i < saveResults.size(); i++) {
                if (!saveResults[i].isSuccess()) {
                    for (Database.Error err : saveResults[i].getErrors()) {
                        result.errors.add(
                            'Failed to re-parent ' + childObjectName +
                            ' record Id ' + String.valueOf(children[i].get('Id')) +
                            ': ' + err.getStatusCode() + ' - ' + err.getMessage()
                        );
                    }
                }
            }
        }
    }

    // ----------------------------------------------------------------------
    // PRIVATE: DELETE DUPLICATE PRODUCTS
    // ----------------------------------------------------------------------
    /**
     * Deletes the duplicate Product2 records.
     *
     * Uses Database.delete with allOrNone=false so that:
     *  - Records that cannot be deleted due to dependencies, validation rules,
     *    or sharing restrictions are reported in MergeResult.errors.
     *  - Other duplicates are still deleted where possible.
     *
     * @param duplicateProductIds  Set of Product2 Ids to delete.
     * @param result               MergeResult to record deleted Ids and errors.
     */
    private static void deleteDuplicateProducts(Set<Id> duplicateProductIds, MergeResult result) {
        if (duplicateProductIds.isEmpty()) {
            return;
        }

        List<Id> duplicateList = new List<Id>(duplicateProductIds);
        Database.DeleteResult[] deleteResults = Database.delete(duplicateList, false); // allOrNone = false

        for (Integer i = 0; i < deleteResults.size(); i++) {
            Database.DeleteResult dr = deleteResults[i];
            Id currentId = duplicateList[i];

            if (dr.isSuccess()) {
                result.deletedDuplicateIds.add(currentId);
            } else {
                for (Database.Error err : dr.getErrors()) {
                    result.errors.add(
                        'Failed to delete Product2 Id ' + String.valueOf(currentId) +
                        ': ' + err.getStatusCode() + ' - ' + err.getMessage()
                    );
                }
            }
        }
    }
}

/*
===============================================================================
Example Usage (Apex Anonymous or from another Apex class)
===============================================================================

List<Id> productsToProcess = new List<Id>{
    '01tXXXXXXXXXXXXAAA',
    '01tXXXXXXXXXXXXAAB',
    '01tXXXXXXXXXXXXAAC'
};

// Call the merge method.
ProductMergeService.MergeResult mergeResult =
    ProductMergeService.mergeDuplicatesByProductCode(productsToProcess);

// Inspect results.
System.debug('Input Product Ids:      ' + mergeResult.inputProductIds);
System.debug('Retained Master Ids:    ' + mergeResult.retainedProductIds);
System.debug('Deleted Duplicate Ids:  ' + mergeResult.deletedDuplicateIds);
System.debug('Errors (if any):        ' + mergeResult.errors);

/*
Notes:
- Deploy this class to a sandbox first and test with a small set of Products.
- You can wrap the call in:
    * A Queueable or Batch Apex for large-scale clean-up.
    * A custom Lightning/Visualforce controller, Flow Action, or Invocable
      method if you want admins/users to trigger the merge via UI or Flow.
- If you want finer control, you can:
    * Change the master-selection logic (e.g., by Name, IsActive, custom field).
    * Restrict re-parenting to specific child objects (instead of using generic
      Schema-based discovery).
*/