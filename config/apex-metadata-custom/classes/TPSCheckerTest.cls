@isTest
private class TPSCheckerTest {

    // Mock HTTP response class
    private class MockTPSResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"listed"}');
            res.setStatusCode(200);
            return res;
        }
    }

    @isTest
    static void testTPSCheckerBatch() {
        // Create test data
        List<Account> testAccounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            testAccounts.add(new Account(
                Name = 'Test Account ' + i,
                Phone = '0123456789',
                Next_TPS_Check__c = Date.today()
            ));
        }
        insert testAccounts;

        // Set the mock response
        Test.setMock(HttpCalloutMock.class, new MockTPSResponse());

        // Run the batch
        Test.startTest();
        TPSChecker batch = new TPSChecker();
        Database.executeBatch(batch, 200);
        Test.stopTest();

        // Validate results
        List<Account> updatedAccounts = [
            SELECT Id, Last_TPS_Checked__c, Next_TPS_Check__c, PhoneDNU__c
            FROM Account
            WHERE Id IN :testAccounts
        ];

        for (Account acc : updatedAccounts) {
            System.assertEquals(Date.today(), acc.Last_TPS_Checked__c, 'Last TPS Checked should be today');
            System.assertEquals(Date.today().addDays(28), acc.Next_TPS_Check__c, 'Next TPS Check should be 28 days later');
            System.assertEquals(true, acc.PhoneDNU__c, 'PhoneDNU__c should be true based on mock response');
        }
    }
}