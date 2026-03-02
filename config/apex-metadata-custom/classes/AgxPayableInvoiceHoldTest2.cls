@isTest(SeeAllData=true)
private class AgxPayableInvoiceHoldTest2 {

    @isTest
    static void testInvokeFromFlow() {
        // Query existing data
        c2g__codaPurchaseInvoice__c invoice = [SELECT Id, c2g__OwnerCompany__r.Name FROM c2g__codaPurchaseInvoice__c WHERE SCMFFA__AP_Voucher__c != NULL AND c2g__InvoiceStatus__c = 'Complete' AND c2g__PaymentStatus__c = 'Unpaid' LIMIT 1];
        AgxPayableInvoiceHold.FlowInputs inputs = new AgxPayableInvoiceHold.FlowInputs();
        inputs.payableInvoiceId = invoice.Id;
        inputs.companyName = invoice.c2g__OwnerCompany__r.Name;

        Test.startTest();
        AgxPayableInvoiceHold.invokeFromFlow(new List<AgxPayableInvoiceHold.FlowInputs>{inputs});
        Test.stopTest();

        // Verify that the invoice was placed on hold
        invoice = [SELECT Id, c2g__HoldStatus__c FROM c2g__codaPurchaseInvoice__c WHERE Id = :invoice.Id];
        System.assertEquals('On Hold', invoice.c2g__HoldStatus__c);
    }

    @isTest
    static void testPlacePayableInvoiceHold() {
        // Query existing data
        c2g__codaPurchaseInvoice__c invoice = [SELECT Id, c2g__OwnerCompany__r.Name FROM c2g__codaPurchaseInvoice__c where c2g__InvoiceStatus__c = 'Complete' AND c2g__PaymentStatus__c = 'Unpaid' LIMIT 1];

        Test.startTest();
        AgxPayableInvoiceHold.placePayableInvoiceHold(invoice.Id, invoice.c2g__OwnerCompany__r.Name);
        Test.stopTest();

        // Verify that the invoice was placed on hold
        invoice = [SELECT Id, c2g__HoldStatus__c FROM c2g__codaPurchaseInvoice__c WHERE Id = :invoice.Id];
        System.assertEquals('On Hold', invoice.c2g__HoldStatus__c);
    }
}