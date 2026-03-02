@isTest
public class VantageApiInvoiceQueryTest {

    public class HttpCalloutMockImpl implements HttpCalloutMock {
        HttpResponse res = new HttpResponse();
        String responseBody = '{"value":[{"Id":1,"Reference":"ref1","InvoiceDate":"2023-06-28","DueDate":"2023-07-28","BaseNetValue":"100.0","BaseTotalValue":"120.0","Type":"type1","SubType":"subtype1"}]}';
        
        public HTTPResponse respond(HTTPRequest req) {
            res.setBody(responseBody);
            res.setStatusCode(200);
            return res;
        }
    }
    
    @isTest
    static void testPsr() {
        // Register the mock
        Test.setMock(HttpCalloutMock.class, new HttpCalloutMockImpl());
        
        // Prepare test data
        VantageApiInvoiceQuery.FlowInputs input = new VantageApiInvoiceQuery.FlowInputs();
        input.query = 'TestQuery';
        input.token = 'TestToken';
        input.accountId = '001000000000001';
        input.accountName = 'Test Account';
        VantageApiInvoiceQuery.FlowInputs[] inputs = new VantageApiInvoiceQuery.FlowInputs[]{input};
        
        // Start the test, call the method and stop the test
        Test.startTest();
        VantageApiInvoiceQuery.FlowOutput[] results = VantageApiInvoiceQuery.psr(inputs);
        Test.stopTest();
        
        // Verify the result
        System.assertEquals(1, results.size());
        System.assertEquals(1, results[0].accountInvoices.size());
        Vantage_Invoice__c invoice = results[0].accountInvoices[0];
        System.assertEquals(1, invoice.Id__c);
        System.assertEquals('ref1', invoice.Reference__c);
        System.assertEquals(Date.newInstance(2023, 6, 28), invoice.InvoiceDate__c);
        System.assertEquals(Date.newInstance(2023, 7, 28), invoice.DueDate__c);
        System.assertEquals(100.0, invoice.BaseNetValue__c);
        System.assertEquals(120.0, invoice.BaseTotalValue__c);
        System.assertEquals('001000000000001', invoice.Account__c);
        System.assertEquals('type1', invoice.Type__c);
        System.assertEquals('subtype1', invoice.SubType__c);
        System.assertEquals('Test Account ref1', invoice.Name);
    }
}