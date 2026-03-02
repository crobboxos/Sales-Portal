public class DiscardInvoices {

    public class FlowInputs {       
        @InvocableVariable
        public String[] invoiceIds;

        @InvocableVariable
        public String discardReason;
    }

    @InvocableMethod
    public static void discardInvoices(FlowInputs[] request) {

        FlowInputs inputs = request.get(0);
        String localDiscardReason = inputs.discardReason;
        String[] localInvoiceIds = inputs.invoiceIds;

        Set<Id> invoiceIds = new Set<Id>();
        for (String s : localInvoiceIds) {
            invoiceIds.add(s);
        }
        
        // Use the DiscardPxService to discard the invoices
        c2g.DiscardPxService.discardSync(invoiceIds, localDiscardReason);

    }

}