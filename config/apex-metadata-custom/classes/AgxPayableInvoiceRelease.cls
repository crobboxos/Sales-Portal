public with sharing class AgxPayableInvoiceRelease {
    public class FlowInputs {
        @InvocableVariable(label='Payable Invoice Id')
        public Id payableInvoiceId;
        
        @InvocableVariable(label='Company Name')
        public String companyName;
    }

    @InvocableMethod(label='Payable Invoice Release' description='Auto-release Payable Invoice on Hold')
    public static void invokeFromFlow(List<FlowInputs> inputs) {
        for (FlowInputs input : inputs) {
            releasePayableInvoice(input.payableInvoiceId, input.companyName);
        }
    }

    public static void releasePayableInvoice(Id payableInvoiceId, String companyName) {
        c2g__codaPurchaseInvoice__c payableInvoiceToRelease = [SELECT Id FROM c2g__codaPurchaseInvoice__c WHERE Id = :payableInvoiceId];

        c2g.CODAAPICommon_9_0.Context con = new c2g.CODAAPICommon_9_0.Context(); 
        con.CompanyName = companyName;

        c2g.CODAAPICommon.Reference ref = new c2g.CODAAPICommon.Reference(); 
        ref.Id = payableInvoiceId;
        c2g.CODAAPIPurchaseInvoice_9_0.ReleaseForPayment(con, ref);
    }
}