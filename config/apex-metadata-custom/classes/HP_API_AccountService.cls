public class HP_API_AccountService {

    public static void getAccounts() {
        // 1) Get the existing HP_Configer__c record that HPAuthService has already created
        List<HP_Configer__c> cfgList = [
            SELECT Id, Access_Token__c
            FROM HP_Configer__c
            WHERE Id = 'aGDAe000000DlU9OAK'
            LIMIT 1
        ];

        if (cfgList.isEmpty()) {
            System.debug('❌ No HP_Configer__c record found. Run HPAuthService.getAccessToken() first.');
            return;
        }

        HP_Configer__c cfg = cfgList[0];

        if (String.isBlank(cfg.Access_Token__c)) {
            System.debug('❌ HP_Configer__c record has no Access_Token__c value.');
            return;
        }

        String accessToken = cfg.Access_Token__c;

        // 2) Call HP Accounts API using that token
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://hp-bss.eu.interworks.cloud/api/accounts?pageIndex=1&pageSize=500');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('X-Api-Version', '3');
        req.setHeader('Accept', 'application/json');

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('HP Accounts Status: ' + res.getStatusCode());
        System.debug('HP Accounts Body: ' + res.getBody());

        if (res.getStatusCode() != 200) {
            System.debug('❌ Error calling HP Accounts API: ' + res.getBody());
            return;
        }

        // Optional: basic parse – you can extend this once you know the exact structure
        Object root = JSON.deserializeUntyped(res.getBody());
        System.debug('Parsed JSON type: ' + root.toString());
    }
}