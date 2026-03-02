public class TPSCallout implements Database.Batchable<sObject>, Database.AllowsCallouts {
    private static final Date TODAY = Date.today();
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Phone, MobilePhone, TPS_Next_Check__c,TPS_Last_Checked__c,PhoneDNU__c,MobileDNU__c
            FROM Contact
            WHERE TPS_Next_Check__c = :TODAY
            AND (Phone != NULL OR MobilePhone != NULL)
        ]);
    }
    
    public void execute(Database.BatchableContext bc, List<sObject> scope) {

        List<Contact> contacts = scope;
        for (Contact c : contacts) {
            if(c.Phone != NULL){
                c.PhoneDNU__c = sendTPSRequest(c.Phone);
            }
            if(c.MobilePhone != NULL){
                c.MobileDNU__c = sendTPSRequest(c.MobilePhone);
            }
            c.TPS_Last_Checked__c = TODAY;
            c.TPS_Next_Check__c = TODAY + 28;
        }
        update contacts;
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