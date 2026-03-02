public with sharing class CommissionPaymentController {
    @AuraEnabled
    public static List<Commission_Payment__c> getCommissionPayments(Id opportunityId, Id userId) {
        List<Commission_Payment__c> commissionPayments = [SELECT Id, Suggested_Payment__c
                                                           FROM Commission_Payment__c
                                                           WHERE Opportunity__c = :opportunityId
                                                           AND Salesperson__c = :userId];
        return commissionPayments;
    }
}