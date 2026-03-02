@isTest
private class ShowAssetsTest {
    private static testmethod void testgetAssets(){
        
        Account acc = new Account();
        acc.Name = 'test';
        acc.BillingStreet = 'street';
        acc.BillingCity = 'City';
        acc.BillingPostalCode = '12334';
        acc.ShippingStreet = 'test';
        acc.ShippingCity = 'test';
        acc.ShippingPostalCode = '98765';
        insert acc;
        
        Asset ast = new Asset();
        ast.Name = 'test';
        ast.AccountId = acc.Id;
        insert ast;
        
        Asset ass = new Asset();
        ass.Name = 'test';
        ass.AccountId = acc.Id;
        ass.ParentId = ast.Id;
        insert ass;
        
        List<Asset> assList = ShowAssets.getAssets(string.valueOf(acc.Id));
        system.assertNotEquals(null, ass.Id);
    }
    
    private static testmethod void testgetSelectedAssets(){
        List<String> selectedAssets = new List<String>();
        
        Account acc = new Account();
        acc.Name = 'test';
        acc.BillingStreet = 'street';
        acc.BillingCity = 'City';
        acc.BillingPostalCode = '12334';
        acc.ShippingStreet = 'test';
        acc.ShippingCity = 'test';
        acc.ShippingPostalCode = '98765';
        insert acc;
        
        Asset ass = new Asset();
        ass.Name = 'test';
        ass.ParentId = ass.Id;
        ass.AccountId = acc.Id;
        insert ass;
        
        List<Asset> assList = ShowAssets.getSelectedAssets(selectedAssets);
        system.assertNotEquals(null, ass.Id);
    }
}