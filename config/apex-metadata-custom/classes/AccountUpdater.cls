public with sharing class AccountUpdater {
    @AuraEnabled
    public static void updateAccountName(Id accountId) {
        try {
            Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId LIMIT 1];
            acc.Name = 'I\'ve been updated';
            update acc;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating account: ' + e.getMessage());
        }
    }
}