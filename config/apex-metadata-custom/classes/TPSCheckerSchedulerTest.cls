@isTest
private class TPSCheckerSchedulerTest {

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
    static void testScheduler() {
        // Insert mock Accounts for TPSChecker
        List<Account> testAccounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            testAccounts.add(new Account(
                Name = 'Scheduled Test ' + i,
                Phone = '0123456789',
                Next_TPS_Check__c = Date.today()
            ));
        }
        insert testAccounts;

        // Set HTTP mock
        Test.setMock(HttpCalloutMock.class, new MockTPSResponse());

        // Set up a CRON expression for scheduling (runs once immediately in test context)
        String cronExp = '0 0 0 1 1 ? 2050'; // Arbitrary future date

        Test.startTest();
        String jobId = System.schedule('Test TPS Scheduler', cronExp, new TPSCheckerScheduler());
        Test.stopTest();

        // Assert the scheduled job ID is not null
        System.assertNotEquals(null, jobId, 'Scheduler should return a job ID');
    }
}