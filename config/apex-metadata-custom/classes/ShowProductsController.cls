public class ShowProductsController {
    
    @AuraEnabled
    public static List<Product_Groups__c> getSelectedProductRecords(Map<String, String> mapIdValue, List<String> productSelectedList ){
        //
        //List<Product_Groups__c> lst = new List<Product_Groups__c>(); 
        //Map<Id, Product_Groups__c> allProductsMap = new Map<Id,Product_Groups__c>([select Sub_Product__c, Product_Code__c, ProductCode__c from Product_Groups__c where Id =:productSelectedList]);
        //for(String val1 : productSelectedList)
        //{
        //    lst.add(new Product_Groups__c(Id = val1, Quantity__c = Decimal.ValueOf(mapIdValue.get(val1)), Sub_Product__c = allProductsMap.get(val1).Sub_Product__c, Product_Code__c = allProductsMap.get(val1).ProductCode__c ));
        //}
        //return lst;
        //
        List<Product_Groups__c> lst = new List<Product_Groups__c>();
        Map<Id, Product_Groups__c> allProductsMap = new Map<Id,Product_Groups__c>([select Sub_Product__c, Product_Code__c, ProductCode__c from Product_Groups__c where Id =:productSelectedList]);
        for(String val1 : productSelectedList)
        {
            Product_Groups__c pg = new Product_Groups__c();
            pg.Id = val1;
            pg.Quantity__c = Decimal.ValueOf(mapIdValue.get(val1));
            pg.Sub_Product__c = allProductsMap.get(val1).Sub_Product__c;
            pg.Product_Code__c = allProductsMap.get(val1).ProductCode__c;
            lst.add(pg);
        }
        return lst;
    }
}