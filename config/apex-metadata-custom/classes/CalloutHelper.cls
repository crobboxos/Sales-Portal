public class CalloutHelper {

    public class FlowInputs {       
        @InvocableVariable
        public String namedCredentials;
    }

    @InvocableMethod
    public static FlowOutput[] makeCallout(FlowInputs[] inputs) {
        HttpRequest request = new HttpRequest();
        request.setMethod('POST');
        
        // Instantiate Http and set endpoint outside the loop
        Http http = new Http();
        
        List<FlowOutput> flowOutputs = new List<FlowOutput>();
        
        request.setEndpoint('callout:' + inputs.get(0).namedCredentials);
        HttpResponse response = http.send(request);
            
        if (response.getStatusCode() == 200) { // Replace with the expected status code from the API
            // Deserialize the response body into a concrete class
            ResponseData responseData = (ResponseData) JSON.deserialize(response.getBody(), ResponseData.class);
            flowOutputs.add(new FlowOutput(responseData.token));
        }
        
        
        return flowOutputs.isEmpty() ? null : flowOutputs;
    }
    
    public class FlowOutput {
        @InvocableVariable
        public String token;
        
        public FlowOutput(String token) {
            this.token = token;
        }
    }
    
    // Define a class to match the structure of the response data
    public class ResponseData {
        public String token;
    }
}