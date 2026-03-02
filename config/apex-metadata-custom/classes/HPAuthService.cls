public class HPAuthService {
    private static final String AUTH_URL = 'https://hp-bss.eu.interworks.cloud/oauth/token';
    private static final String CLIENT_CREDENTIALS =
        'Basic MDYxZDE0ZjktZGI5OC00YTk5LWE0OTAtNmVhN2JjYzk2OWY0Oi80VC9TM2ZMSU1NS3NLMWlvUDNwUzErcjFhVVRFSzF0M1gvNTZZNkhONjg9';
    private static final String USERNAME = 'mark.burnham';
    private static final String PASSWORD = 'Xeretec@1';

    public static String getAccessToken() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(AUTH_URL);
        req.setMethod('POST');
        req.setHeader('Authorization', CLIENT_CREDENTIALS);
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        // No URL encoding – send it like a normal HTML form
        String body =
            'grant_type=password' +
            '&username=' + USERNAME +
            '&password=' + PASSWORD;
        req.setBody(body);

        System.debug('HP OAuth Request: ' + req);

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('HP OAuth Status: ' + res.getStatusCode());
        System.debug('HP OAuth Body: ' + res.getBody());

        if (res.getStatusCode() == 200) {
            Map<String, Object> result =
                (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            String token   = (String) result.get('access_token');
            Integer ttlSec = (Integer) result.get('expires_in');
            Datetime expiry = Datetime.now().addSeconds(ttlSec);

            // 🔹 Use custom object HP_Configer__c instead of Custom Setting
            List<HP_Configer__c> configs = [
                SELECT Id, Name, Access_Token__c, Token_Expiry__c
                FROM HP_Configer__c
                LIMIT 1
            ];

            HP_Configer__c config;
            if (configs.isEmpty()) {
                // Name is required on a custom object – give it something sensible
                config = new HP_Configer__c();
            } else {
                config = configs[0];
            }

            config.Access_Token__c = token;
            config.Token_Expiry__c = expiry;

            upsert config;

            System.debug('HP OAuth token stored. Expires at: ' + expiry);
            return token;
        } else {
            System.debug('HP OAuth token request failed');
            System.debug('Status code: ' + res.getStatusCode());
            System.debug('Body: ' + res.getBody());
            throw new CalloutException('Failed to get token: ' + res.getBody());
        }
    }
}