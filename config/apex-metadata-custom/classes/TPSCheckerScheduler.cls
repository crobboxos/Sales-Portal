public class TPSCheckerScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        TPSCallout tpsContactCallout = new TPSCallout();
        Database.executeBatch(tpsContactCallout, 40); // 40 records per batch
        TPSChecker tpsAccountCallout = new TPSChecker();
        Database.executeBatch(tpsAccountCallout, 40); // 40 records per batch
    }
}