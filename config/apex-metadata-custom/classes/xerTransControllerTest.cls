@isTest(SeeAllData=true)
private class xerTransControllerTest {
    @isTest static void myTest() {

        // Build temp lists...
        List<c2g__codaTransactionLineItem__c> tlis = new List<c2g__codaTransactionLineItem__c>() ;
        List<Account> accts = [SELECT Name From Account where name = 'A4 Design & Print Ltd'];
        System.assertEquals(1,accts.size());
        if(!accts.IsEmpty()) {
            System.debug('No Error');
            Account a = accts[0];
            //Move the current Apex page to the newly created account record...
            PageReference pageRef = Page.xerAccOverTrans;
            Test.setCurrentPage(pageRef);
            ApexPages.StandardController sc = new ApexPages.StandardController(a);
            
            Test.startTest();
                xerTransController testTrans = new xerTransController(sc);
                tlis = testTrans.getTrans();
                system.assertNotEquals(0,tlis.size(),'No transactions were found to qualify');
            Test.stopTest();
        }
    }
}