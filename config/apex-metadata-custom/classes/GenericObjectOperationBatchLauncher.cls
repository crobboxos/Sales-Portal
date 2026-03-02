public class GenericObjectOperationBatchLauncher {
    public class Request {
        @InvocableVariable
        public List<SObject> records;   // Any sObject collection from Flow

        @InvocableVariable
        public String operation;        // "Insert", "Update", or "Upsert" (case-insensitive)

        @InvocableVariable
        public Integer scopeSize;       // Optional; default 200
    }

    public class Response {
        @InvocableVariable
        public Id jobId;
    }

    @InvocableMethod
    public static List<Response> launch(List<Request> requests) {
        Request r = (requests == null || requests.isEmpty()) ? new Request() : requests[0];

        // Normalize operation string
        String op = (r.operation == null) ? 'insert' : r.operation.trim().toLowerCase();
        if (op != 'insert' && op != 'update' && op != 'upsert') {
            op = 'insert';
        }

        // Enforce scope size range (1..2000)
        Integer scope = (r.scopeSize == null || r.scopeSize <= 0) ? 200 : Math.min(r.scopeSize, 2000);

        Id jobId = Database.executeBatch(new GenericObjectOperationBatch(r.records, op), scope);

        Response resp = new Response();
        resp.jobId = jobId;
        return new List<Response>{ resp };
    }
}