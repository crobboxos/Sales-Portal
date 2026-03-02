@IsTest
private class GenericObjectOperationBatchTest {

    @IsTest
    static void testInsertOperation() {
        List<SObject> accounts = new List<SObject>{
            new Account(Name = 'Test Insert 1'),
            new Account(Name = 'Test Insert 2')
        };

        Test.startTest();
        Id jobId = Database.executeBatch(new GenericObjectOperationBatch(accounts, 'insert'), 200);
        Test.stopTest();

        System.assertNotEquals(null, jobId, 'Batch Job Id should not be null.');
        Integer count = [SELECT COUNT() FROM Account WHERE Name LIKE 'Test Insert%'];
        System.assertEquals(2, count, 'Two accounts should have been inserted.');
    }

    @IsTest
    static void testUpdateOperation() {
        // Insert initial accounts
        List<Account> accs = new List<Account>{
            new Account(Name = 'Update Target 1'),
            new Account(Name = 'Update Target 2')
        };
        insert accs;

        // Prepare updates
        for (Account a : accs) {
            a.Name = a.Name + ' - Updated';
        }
        List<SObject> updateRecords = new List<SObject>();
        updateRecords.addAll(accs);

        Test.startTest();
        Id jobId = Database.executeBatch(new GenericObjectOperationBatch(updateRecords, 'update'), 200);
        Test.stopTest();

        System.assertNotEquals(null, jobId, 'Batch Job Id should not be null.');
        Integer updatedCount = [SELECT COUNT() FROM Account WHERE Name LIKE '%Updated%'];
        System.assertEquals(2, updatedCount, 'Two accounts should have been updated.');
    }

    @IsTest
    static void testUpsertOperation() {
        // Insert one account to update, and prepare one new account to insert
        Account existing = new Account(Name = 'Upsert Target');
        insert existing;

        existing.Name = 'Upsert Target - Updated';
        Account newAcc = new Account(Name = 'Upsert New');

        List<SObject> upsertRecords = new List<SObject>{ existing, newAcc };

        Test.startTest();
        Id jobId = Database.executeBatch(new GenericObjectOperationBatch(upsertRecords, 'upsert'), 200);
        Test.stopTest();

        System.assertNotEquals(null, jobId, 'Batch Job Id should not be null.');
        Integer updatedCount = [SELECT COUNT() FROM Account WHERE Name LIKE '%Updated%'];
        System.assertEquals(1, updatedCount, 'One account should have been updated.');
        Integer insertedCount = [SELECT COUNT() FROM Account WHERE Name = 'Upsert New'];
        System.assertEquals(1, insertedCount, 'One new account should have been inserted.');
    }

    @IsTest
    static void testLauncherWithDefaults() {
        List<SObject> accounts = new List<SObject>{
            new Account(Name = 'Launcher Test 1'),
            new Account(Name = 'Launcher Test 2')
        };

        GenericObjectOperationBatchLauncher.Request req = new GenericObjectOperationBatchLauncher.Request();
        req.records = accounts;
        req.operation = 'Insert';
        req.scopeSize = 100;

        Test.startTest();
        List<GenericObjectOperationBatchLauncher.Response> resp =
            GenericObjectOperationBatchLauncher.launch(new List<GenericObjectOperationBatchLauncher.Request>{ req });
        Test.stopTest();

        System.assertEquals(1, resp.size(), 'Launcher should return one response.');
        System.assertNotEquals(null, resp[0].jobId, 'Batch Job Id should not be null.');
        Integer count = [SELECT COUNT() FROM Account WHERE Name LIKE 'Launcher Test%'];
        System.assertEquals(2, count, 'Two accounts should have been inserted via launcher.');
    }
}