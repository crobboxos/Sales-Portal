public class xerTransController
{

    public static id parentId;
    public xerTransController(ApexPages.StandardController controller) {
        parentId=controller.getId();
    }
    
    public List<c2g__codaTransactionLineItem__c> setList {
        get {
            if(setList == null) {
                setList = [SELECT c2g__Transaction__r.Id,c2g__Transaction__r.c2g__Account__c,c2g__Transaction__r.c2g__TransactionDate__c,c2g__Transaction__r.c2g__TransactionType__c,
                c2g__Transaction__r.c2g__DocumentTotal__c,c2g__Transaction__r.c2g__DocumentReference__c,c2g__Transaction__r.c2g__DocumentDescription__c,c2g__DocumentValue__c,
                c2g__HomeOutstandingValue__c,c2g__DaysOverdue__c,c2g__DocumentNumber__c,Transaction_Age__c, c2g__HomeValue__c  FROM c2g__codaTransactionLineItem__c
            WHERE c2g__HomeOutstandingValue__c>0 AND c2g__Transaction__r.c2g__Account__c = :parentId];
            }
            return setList;
        }
        set;
    }
    
    public List<c2g__codaTransactionLineItem__c> getTrans() { return setList;}
   
}