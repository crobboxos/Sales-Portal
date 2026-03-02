public with sharing class AutomaticCashMatching {

    public class DirectTransaction {
        @AuraEnabled public Id CashEntry;
        @AuraEnabled public String TransactionType;
        @AuraEnabled public Id Invoice;
        @AuraEnabled public Decimal Value;
    }

    // Method to perform automatic cash matching
    public static void performCashMatching() {
        // Query unmatched cash entries (assuming c2g__codaCashEntry__c has a field for matching status)
        List<c2g__codaCashEntry__c> unmatchedCashEntries = [
            SELECT Id, c2g__Reference__c, c2g__Value__c, c2g__Account__c
            FROM c2g__codaCashEntry__c
            WHERE c2g__Status__c = 'Unmatched' // Assuming status field
            AND c2g__Value__c > 0
        ];

        // Query unmatched sales invoices
        List<c2g__codaInvoice__c> unmatchedInvoices = [
            SELECT Id, Name, c2g__OutstandingValue__c, c2g__Account__c
            FROM c2g__codaInvoice__c
            WHERE c2g__OutstandingValue__c > 0
            AND c2g__InvoiceStatus__c = 'Complete' // Assuming status
        ];

        // Map for quick lookup: reference to invoice
        Map<String, c2g__codaInvoice__c> invoiceMap = new Map<String, c2g__codaInvoice__c>();
        for (c2g__codaInvoice__c inv : unmatchedInvoices) {
            invoiceMap.put(inv.Name, inv);
        }

        // List to hold matching transactions
        List<DirectTransaction> directTransactions = new List<DirectTransaction>();

        // Match cash to invoices
        for (c2g__codaCashEntry__c cash : unmatchedCashEntries) {
            if (invoiceMap.containsKey(cash.c2g__Reference__c)) {
                c2g__codaInvoice__c invoice = invoiceMap.get(cash.c2g__Reference__c);
                if (cash.c2g__Value__c == invoice.c2g__OutstandingValue__c && cash.c2g__Account__c == invoice.c2g__Account__c) {
                    // Create direct transaction for matching
                    DirectTransaction dt = new DirectTransaction();
                    dt.TransactionType = 'Cash Matching'; // Adjust based on API
                    dt.CashEntry = cash.Id;
                    dt.Invoice = invoice.Id;
                    dt.Value = cash.c2g__Value__c;
                    directTransactions.add(dt);

                    // Mark as matched (update status)
                    cash.c2g__Status__c = 'Matched';
                    //invoice.c2g__OutstandingValue__c = 0; // Or appropriate field
                }
            }
        }

        // Create the direct transactions using the API
        if (!directTransactions.isEmpty()) {
            //c2g.DirectTransactionService.createDirectTransactions(directTransactions); // Assuming method exists
        }

        // Update records
        update unmatchedCashEntries;
        update unmatchedInvoices;
    }
}