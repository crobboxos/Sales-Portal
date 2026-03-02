/**
 * Auto Generated and Deployed by the Declarative Lookup Rollup Summaries Tool package (dlrs)
 **/
@IsTest
private class dlrs_c2godaInvoiceTest
{
    @IsTest(SeeAllData=true)
    private static void testTrigger()
    {
// Create parent Account
Account a = new Account(
    Name = 'DLRS Test Account'
);
insert a;

// Query an existing c2g company (requires See All Data = true)
c2g__codaCompany__c co = [
    SELECT Id
    FROM c2g__codaCompany__c
    LIMIT 1
];

// Create invoice with all required fields
c2g__codaInvoice__c inv = new c2g__codaInvoice__c(
    c2g__OwnerCompany__c = co.Id,
    c2g__Account__c      = a.Id
);

insert inv;
    }
}