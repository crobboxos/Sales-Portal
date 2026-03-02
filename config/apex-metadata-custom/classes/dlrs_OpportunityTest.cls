/**
 * Auto Generated and Deployed by the Declarative Lookup Rollup Summaries Tool package (dlrs)
 **/
@IsTest
private class dlrs_OpportunityTest
{
    @IsTest
    private static void testTrigger()
    {
Account a = new Account(
    Name = 'DLRS Test Account',
    SCMC__Active__c   = true,
    SCMC__Customer__c = true,
    SCMC__E_Mail__c   = 'callum.robertson@xeretec.co.uk'
);
insert a;

Opportunity o = new Opportunity(
    Name      = 'DLRS Test Opp',
    AccountId = a.Id,
    StageName = 'Closed Won',
    CloseDate = System.today().addMonths(-1),
    OwnerId   = UserInfo.getUserId(),

    Approval_Status__c    = 'Approved',
    Notifiy__c            = 'No Requirement',
    Company_ERP__c        = 'a0C4K000003ToYHUA0',
    Lines_Of_Business__c  = 'Digital Workspace',

    Estimated_Costs__c    = 1,
    Estimated_Revenue__c  = 1
);
insert o;

o.Name = 'DLRS Test Opp Updated';
update o;

delete o;
    }
}