@isTest
private class ShowProductsControllerTest {
    private static testmethod void testgetSelectedProductRecords(){
        c2g__codaGeneralLedgerAccount__c cgla = new c2g__codaGeneralLedgerAccount__c();
        cgla.c2g__ReportingCode__c = 'test';
        cgla.c2g__Type__c = 'Balance Sheet';
        insert cgla;
        
        Product_Category__c pc = new Product_Category__c();
        pc.Category__c = 'Goods';
        pc.GRNI_Accrual_Account__c = cgla.Id;
        pc.Cost_Of_Sales__c = cgla.Id;
        pc.Purchase_Analysis_Account__c = cgla.Id;
        pc.Inventory_GL_Code__c = cgla.Id;
        pc.Sales_Revenue_Account__c = cgla.Id;
        insert pc;
        
        Account acc = new Account();
        acc.Name = 'test';
        acc.BillingCity = 'city';
        acc.BillingStreet = 'Street';
        acc.BillingPostalCode = '1001';
        acc.ShippingStreet = 'Street 1';
        acc.ShippingCity = 'city 1';
        acc.ShippingPostalCode = '1001S';
        insert acc;
        
        Product2 p2 = new Product2();
        p2.Name = 'test';
        p2.Product_Category__c = pc.Id;
        p2.Manufacturer__c = acc.Id;
        p2.Product_Sub_Type__c = 'Accessory';
        insert p2;
        
        List<String> productSelected = new List<String>();
        Product_Groups__c pg = new Product_Groups__c();
        pg.Sub_Product__c = p2.Id;       
        insert pg;
        productSelected.add(string.valueOF(pg.ID));
        
        Map<String, String> mapIdValue = new Map<String, String>(); 
        mapIdValue.put(string.valueOF(pg.ID), '8');
        List<Product_Groups__c> productGroupsList = ShowProductsController.getSelectedProductRecords(mapIdValue , productSelected);
        System.assertNotEquals(null, productGroupsList);
    }
}