/**
 * Auto Generated and Deployed by the Declarative Lookup Rollup Summaries Tool package (dlrs)
 **/
@IsTest
private class dlrs_AccountTest
{
    @IsTest(SeeAllData=true)
    private static void testTrigger()
    {
Account a = new Account(
    Name = 'DLRS Test Account'
);
insert a;
    }
}