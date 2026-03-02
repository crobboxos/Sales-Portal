public with sharing class ShowAccessoriesManagedServices2Assign {
    @AuraEnabled
    public static List<Product2> getSelectedProductRecords(Map<String, String> mapIdValue, List<String> productSelectedList ){
        
        /*
        List<Product2> lst = new List<Product2>(); 
        Map<Id, Product2> allProductsMap = new Map<Id,Product2>([select Sub_Product__c from Product2 where Id =:productSelectedList]);
        for(String val1 : productSelectedList)
        {
            lst.add(new Product2(Id = val1, Quantity__c = Decimal.ValueOf(mapIdValue.get(val1)), Sub_Product__c = allProductsMap.get(val1).Sub_Product__c ));
        }
        return lst;
        */

        List<Product2> lst = new List<Product2>(); 
        Map<Id, Product2> allProductsMap = new Map<Id,Product2>([select Quantity__c from Product2 where Id =:productSelectedList]);
        for(String val1 : productSelectedList)
        {
            lst.add(new Product2(Id = val1, Quantity__c = Decimal.ValueOf(mapIdValue.get(val1)) ));
        }
        return lst;
    }
}