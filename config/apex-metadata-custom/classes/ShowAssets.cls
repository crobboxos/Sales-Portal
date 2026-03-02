public class ShowAssets {
    
    @AuraEnabled
    public static List<Asset> getAssets(String accountId ){
        //Map<Id, Asset> result = new Map<Id, Asset>();
        List<Asset> result = new List<Asset>();
        for(Asset ast : [select Id, Name, ParentId, Parent.Name, SerialNumber from Asset where (AccountId =:accountId OR Site_Account__c =:accountId) AND Status = 'Active'])
        {
            //if(ast.ParentId == null && !result.containsKey(ast.ParentId))
                //result.put(ast.ParentId, new Asset(Id = ast.ParentId, Name = ast.Parent.Name, SerialNumber =ast.SerialNumber ));

            result.add(ast);
        }
       // return result.Values();
       return result;
    }

    @AuraEnabled
    public static List<Asset> getSelectedAssets(List<String> selectedAssets ){
        return [select Id, Name from Asset where Id =:selectedAssets];
    }
}