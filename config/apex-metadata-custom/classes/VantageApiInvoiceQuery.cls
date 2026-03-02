public inherited sharing class VantageApiInvoiceQuery {
    
    public class FlowInputs {       
        @InvocableVariable
        public String query,
        token,
        accountId,
        accountName;
    }
    
    public class FlowOutput{
        
        @InvocableVariable public List<Vantage_Invoice__c> accountInvoices;
        public FlowOutput(List<Vantage_Invoice__c> accountInvoices) {
            this.accountInvoices = accountInvoices;
        }
    }
        
    @InvocableMethod
    public static FlowOutput[] psr(FlowInputs[] inputs) {
        try {
            HttpRequest request = new HttpRequest();
            request.setEndpoint('https://api.vantage.online/' + inputs.get(0).query);
            request.setMethod('GET');
            request.setHeader('Authorization', 'Bearer ' + inputs.get(0).token);
            request.setHeader('api-version', '1.19');
            request.setHeader('Accept', 'application/json'); // Return JSON to the caller
            HttpResponse response = new Http().send(request); // Make the request
            return new List<FlowOutput>{new FlowOutput( formatValuesJSON(
                (List<Object>) ((Map<String, Object>) JSON.deserializeUntyped(response.getBody())).get('value'), 
                inputs
            ))};
        } catch (Exception ex) {
            return null;
        }
    }
    
    private static List<Vantage_Invoice__c> formatValuesJSON(List<Object> voResults,  FlowInputs[] inputs) {
        List<Vantage_Invoice__c> values = new List<Vantage_Invoice__c>();
        for(Object loopVOResults: voResults){ 
            Map<String, Object> itemMap = (Map<String, Object>) loopVOResults;
            Vantage_Invoice__c voiList = new Vantage_Invoice__c();
            voiList.Id__c = (Integer) itemMap.get('Id');
            voiList.Reference__c = (String) itemMap.get('Reference');
            voiList.InvoiceDate__c = date.valueOf(itemMap.get('InvoiceDate').toString());
            voiList.DueDate__c =  date.valueOf(itemMap.get('DueDate').toString());
            voiList.BaseNetValue__c = (Double) Double.valueOf(itemMap.get('BaseNetValue'));
            voiList.BaseTotalValue__c = (Double) Double.valueOf(itemMap.get('BaseTotalValue'));
            voiList.Account__c = inputs.get(0).accountId;
            voiList.Type__c = (String) itemMap.get('Type');
            voiList.SubType__c = (String) itemMap.get('SubType');
            voiList.CurrencyISOCode = (String) itemMap.get('CurrencyCodeFrom');
            voiList.Name = inputs.get(0).accountName + ' ' + (String) itemMap.get('Reference');
            values.add(voiList);
        } 
        return values;
    }   
}