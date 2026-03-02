@isTest
public class TPSCalloutTest {

    private class TPSMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"status":"listed"}');
            return res;
        }
    }

    @isTest static void testTPSCallout() {
        // Prepare test data
        Contact testContact = new Contact(FirstName = 'Test', LastName = 'Contact', Phone = '1234567890', MobilePhone = '0987654321', TPS_Next_Check__c = Date.today());
        insert testContact;

        // Set up the mock
        Test.setMock(HttpCalloutMock.class, new TPSMock());

        // Start the test
        Test.startTest();
        TPSCallout tpsCallout = new TPSCallout();
        Database.executeBatch(tpsCallout);
        Test.stopTest();

        // Verify the result
        Contact updatedContact = [SELECT TPS_Last_Checked__c, TPS_Next_Check__c, PhoneDNU__c, MobileDNU__c FROM Contact WHERE Id = :testContact.Id];
        System.assertEquals(Date.today(), updatedContact.TPS_Last_Checked__c, 'TPS_Last_Checked__c should be updated to today');
        System.assertEquals(Date.today().addDays(28), updatedContact.TPS_Next_Check__c, 'TPS_Next_Check__c should be updated to 28 days from today');
        System.assertEquals(true, updatedContact.PhoneDNU__c, 'PhoneDNU__c should be updated to the response of the callout');
        System.assertEquals(true, updatedContact.MobileDNU__c, 'MobileDNU__c should be updated to the response of the callout');
    }
}