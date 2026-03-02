public class TPSChecker implements Database.Batchable<sObject>, Database.AllowsCallouts {
    private static final Date TODAY = Date.today();
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Phone, Next_TPS_Check__c,Last_TPS_Checked__c,PhoneDNU__c
            FROM Account
            WHERE Next_TPS_Check__c = :TODAY
            AND Phone != NULL
        ]);
    }
    
    public void execute(Database.BatchableContext bc, List<sObject> scope) {

        List<Account> accounts = scope;
        for (Account a : accounts) {
            if(a.Phone != NULL){
                a.PhoneDNU__c = sendTPSRequest(a.Phone);
            }
            a.Last_TPS_Checked__c = TODAY;
            a.Next_TPS_Check__c = TODAY + 28;
        }
        update accounts;
    }

    public static Boolean sendTPSRequest(String phoneNumber) {
        
        String cleanedPhoneNumber = phoneNumber.replaceAll('\\D', '');
        cleanedPhoneNumber = cleanedPhoneNumber.replace('\'', '');
        String newPhoneNumber = 'number=' + cleanedPhoneNumber;
        
        HttpRequest request = new HttpRequest();
        request.setMethod('GET');
        Http http = new Http();
        request.setEndpoint('https://www.121prodata.co.uk/api/?token=63a398f5f83e5d21ac0b78dad5fef04d&number='+ cleanedPhoneNumber);

        HttpResponse response = http.send(request);

            
        if (response.getStatusCode() == 200) { 
            ResponseData responseData = (ResponseData) JSON.deserialize(response.getBody(), ResponseData.class);
            return (responseData.status ==  'listed');
        } else {
            return false;
        }
    }

    public class ResponseData {
        public String status;
    }

    public void finish(Database.BatchableContext bc) {
        // post-processing actions if necessary
    }
}