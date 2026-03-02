@isTest(SeeAllData=true)
private class TestAgxPayableInvoiceRelease {
    
    @isTest
    static void testInvokeFromFlow() {
        // Query existing data
        c2g__codaPurchaseInvoice__c invoice = [SELECT Id, c2g__OwnerCompany__r.Name 
                                               FROM c2g__codaPurchaseInvoice__c 
                                               WHERE c2g__PaymentStatus__c = 'Unpaid' 
                                               AND c2g__HoldStatus__c = 'On Hold'
                                               AND c2g__InvoiceStatus__c = 'Complete'
                                               LIMIT 1];
        AgxPayableInvoiceRelease.FlowInputs inputs = new AgxPayableInvoiceRelease.FlowInputs();
        inputs.payableInvoiceId = invoice.Id;
        inputs.companyName = invoice.c2g__OwnerCompany__r.Name;

        Test.startTest();
        AgxPayableInvoiceRelease.invokeFromFlow(new List<AgxPayableInvoiceRelease.FlowInputs>{inputs});
        Test.stopTest();

        // Verify that the invoice was released
        // This will depend on what changes are made by the c2g.CODAAPIPurchaseInvoice_9_0.ReleaseForPayment method.
        invoice = [SELECT Id, c2g__HoldStatus__c FROM c2g__codaPurchaseInvoice__c WHERE Id = :invoice.Id];
        System.assertEquals(NULL, invoice.c2g__HoldStatus__c); 
    }

    @isTest
    static void testReleasePayableInvoice() {
        // Query existing data
        c2g__codaPurchaseInvoice__c invoice = [SELECT Id, c2g__OwnerCompany__r.Name 
                                               FROM c2g__codaPurchaseInvoice__c 
                                               WHERE c2g__PaymentStatus__c = 'Unpaid' 
                                               AND c2g__HoldStatus__c = 'On Hold'
                                               AND c2g__InvoiceStatus__c = 'Complete'
                                               LIMIT 1];

        Test.startTest();
        AgxPayableInvoiceRelease.releasePayableInvoice(invoice.Id, invoice.c2g__OwnerCompany__r.Name);
        Test.stopTest();

        // Verify that the invoice was released
        // This will depend on what changes are made by the c2g.CODAAPIPurchaseInvoice_9_0.ReleaseForPayment method.
        invoice = [SELECT Id, c2g__HoldStatus__c FROM c2g__codaPurchaseInvoice__c WHERE Id = :invoice.Id];
        System.assertEquals(NULL, invoice.c2g__HoldStatus__c); 
    }
}