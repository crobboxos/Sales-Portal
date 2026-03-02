public class GenericObjectOperationBatch implements Database.Batchable<SObject> {
    // Operation: "insert", "update", or "upsert" (lowercase expected)
    private final String op;
    private final List<SObject> records;

    public GenericObjectOperationBatch(List<SObject> input, String operation) {
        this.records = (input == null) ? new List<SObject>() : input.deepClone(true, true, true);
        this.op = (operation == null) ? 'insert' : operation.trim().toLowerCase();
    }

    public Iterable<SObject> start(Database.BatchableContext bc) {
        // Return a concrete list to avoid cast edge cases
        List<SObject> source = new List<SObject>();
        source.addAll(records);
        return source;
    }

    public void execute(Database.BatchableContext bc, List<SObject> scope) {
        if (op == 'insert') {
            Database.insert(scope, false);
            return;
        }
        if (op == 'update') {
            List<SObject> toUpdate = new List<SObject>();
            for (SObject row : scope) {
                if (row.Id != null) {
                    toUpdate.add(row);
                }
            }
            if (!toUpdate.isEmpty()) {
                Database.update(toUpdate, false);
            }
            return;
        }
        // Default to upsert-by-Id behavior
        Database.upsert(scope, false);
    }

    public void finish(Database.BatchableContext bc) { }
}