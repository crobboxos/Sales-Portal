@isTest
public class DiscardInvoicesTest {

    @isTest static void testDiscardInvoices() {
        // Prepare test data
        String testDiscardReason = 'Test Reason';
        String[] testInvoiceIds = new String[]{'a6A8e000000XhciEAC', 'a6A3M000000Cm3lUAC'}; // these should be Ids of existing Invoices

        // Create FlowInputs instance and populate it
        DiscardInvoices.FlowInputs inputs = new DiscardInvoices.FlowInputs();
        inputs.invoiceIds = testInvoiceIds;
        inputs.discardReason = testDiscardReason;

        // Call the method to test
        Test.startTest();
        DiscardInvoices.discardInvoices(new DiscardInvoices.FlowInputs[]{inputs});
        Test.stopTest();
    }

}