@isTest
public class CalloutHelperTest {

    // This is a Mock for the HttpCallout. Salesforce requires this for testing HTTP callouts
    public class HttpCalloutMockImpl implements HttpCalloutMock {
        HttpResponse res = new HttpResponse();
        String responseBody = '{"token":"sampleToken"}';
        
        public HTTPResponse respond(HTTPRequest req) {
            res.setBody(responseBody);
            res.setStatusCode(200);
            return res;
        }
    }
    
    @isTest
    static void testMakeCallout() {
        // Register the mock
        Test.setMock(HttpCalloutMock.class, new HttpCalloutMockImpl());
        
        // Prepare test data
        CalloutHelper.FlowInputs input = new CalloutHelper.FlowInputs();
        input.namedCredentials = 'TestNamedCredentials';
        CalloutHelper.FlowInputs[] inputs = new CalloutHelper.FlowInputs[]{input};
        
        // Start the test, call the method and stop the test
        Test.startTest();
        CalloutHelper.FlowOutput[] results = CalloutHelper.makeCallout(inputs);
        Test.stopTest();
        
        // Verify the result
        System.assertEquals(1, results.size());
        System.assertEquals('sampleToken', results[0].token);
    }
}