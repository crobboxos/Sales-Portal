public with sharing class AgxPayableInvoiceHold {
    public class FlowInputs {
        @InvocableVariable(label='Payable Invoice Id')
        public Id payableInvoiceId;
        
        @InvocableVariable(label='Company Name')
        public String companyName;
    }

    @InvocableMethod(label='Payable Invoice Hold' description='Auto-place Payable Invoice on Hold')
    public static void invokeFromFlow(List<FlowInputs> inputs) {
        for (FlowInputs input : inputs) {
            placePayableInvoiceHold(input.payableInvoiceId, input.companyName);
        }
    }

    public static void placePayableInvoiceHold(Id payableInvoiceId, String companyName) {
        c2g__codaPurchaseInvoice__c payableInvoiceToHold = [SELECT Id FROM c2g__codaPurchaseInvoice__c WHERE Id = :payableInvoiceId];

        c2g.CODAAPICommon_9_0.Context con = new c2g.CODAAPICommon_9_0.Context(); 
        con.CompanyName = companyName;

        c2g.CODAAPICommon.Reference ref = new c2g.CODAAPICommon.Reference(); 
        ref.Id = payableInvoiceId;
        c2g.CODAAPIPurchaseInvoice_9_0.PlaceOnHold(con, ref);
    }
}