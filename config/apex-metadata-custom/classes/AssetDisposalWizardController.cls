public with sharing class AssetDisposalWizardController {

    @AuraEnabled(cacheable=true)
    public static List<Asset> getActiveAssets(Id accountId) {
        return [
            SELECT Id, Name, SerialNumber, Product2.Name, Status, Product2.Line_of_Business__c
            FROM Asset
            WHERE AccountId = '0014K00000Qfu8ZQAR'//:accountId
            AND Status IN ('Active', 'Active - Storage')
            AND ParentId = null
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<fferpcore__Company__c> getTradingCompanies() {
        return [
            SELECT Id, Name
            FROM fferpcore__Company__c
            ORDER BY Name
        ];
    }

    public class DisposalData {
        @AuraEnabled public Id accountId;
        @AuraEnabled public List<Id> selectedAssetIds;
        @AuraEnabled public Id tradingCompanyId;
        @AuraEnabled public String fundingType;
        @AuraEnabled public Date terminationDate;
        @AuraEnabled public String lossReason;
        @AuraEnabled public Boolean collectionRequired;
        @AuraEnabled public Decimal collectionFee;
        @AuraEnabled public String collectionContact;
        @AuraEnabled public Date collectionDate;
        @AuraEnabled public Boolean settlement;
        @AuraEnabled public Decimal settlementFee;
        @AuraEnabled public List<Id> uploadedFileIds;
        @AuraEnabled public List<MeterReadingData> meterReadings;
    }

    public class MeterReadingData {
        @AuraEnabled public Date dateCaptured;
        @AuraEnabled public Decimal mono;
        @AuraEnabled public Decimal largeMono;
        @AuraEnabled public Decimal xlsMono;
        @AuraEnabled public Decimal colour;
        @AuraEnabled public Decimal largeColour;
        @AuraEnabled public Decimal xlsColour;
        @AuraEnabled public Decimal totalImpressions;
    }

    @AuraEnabled
    public static void processDisposals(String disposalDataJson) {
        DisposalData data = (DisposalData) JSON.deserialize(disposalDataJson, DisposalData.class);

        // Get Account
        Account acc = [SELECT Id, Name, CurrencyIsoCode FROM Account WHERE Id = :data.accountId];

        // Create Opportunity
        Opportunity opp = new Opportunity();
        opp.AccountId = data.accountId;
        opp.Name = acc.Name + ' - Asset Disposal';
        opp.Type = 'Churn';
        opp.CloseDate = data.terminationDate;
        opp.StageName = 'Closed Won';
        opp.CurrencyIsoCode = acc.CurrencyIsoCode;
        opp.Company_ERP__c = data.tradingCompanyId;
        opp.Funding_Type__c = data.fundingType;
        insert opp;

        // Get PricebookEntries
        Map<String, PricebookEntry> pricebookEntries = new Map<String, PricebookEntry>();
        for (PricebookEntry pbe : [
            SELECT Id, Product2.Line_of_Business__c, CurrencyIsoCode
            FROM PricebookEntry
            WHERE ProductCode IN ('COLL - MP', 'COLL - DW', 'SET - MP', 'SET - DW')
            AND CurrencyIsoCode = :acc.CurrencyIsoCode
            AND IsActive = true
        ]) {
            String key = pbe.ProductCode + '_' + pbe.CurrencyIsoCode;
            pricebookEntries.put(key, pbe);
        }

        // Create MACD
        MACD__c macd = new MACD__c();
        macd.Account__c = data.accountId;
        macd.Opportunity__c = opp.Id;
        macd.RecordTypeId = '0128e000000CgZ5AAK';
        macd.Status__c = 'Draft';
        macd.Name = acc.Name + ' - Disposal - ' + Date.today().format();
        insert macd;

        // Process Assets and create MACD Lines
        List<MACD_Line_Item__c> macdLines = new List<MACD_Line_Item__c>();
        List<Asset> assetsToUpdate = new List<Asset>();
        Map<String, Integer> lineItemCounts = new Map<String, Integer>();

        for (Integer i = 0; i < data.selectedAssetIds.size(); i++) {
            Id assetId = data.selectedAssetIds[i];
            MeterReadingData reading = data.meterReadings[i];

            // Create MACD Line
            MACD_Line_Item__c macdLine = new MACD_Line_Item__c();
            macdLine.MACD_Line_Item__c = macd.Id;
            macdLine.Asset__c = assetId;
            macdLine.MACD_Type__c = 'Disposal';
            macdLine.Date_Meters_Captured__c = reading.dateCaptured;
            macdLine.Mono_Meter_Reading__c = reading.mono;
            macdLine.Large_Mono_Readings__c = reading.largeMono;
            macdLine.XLS_Meter_Readings__c = reading.xlsMono;
            macdLine.Colour_Meter_Readings__c = reading.colour;
            macdLine.Large_Colour_Readings__c = reading.largeColour;
            macdLine.XLS_Colour_Meter_Readings__c = reading.xlsColour;
            macdLine.Total_Impressions__c = reading.totalImpressions;
            macdLines.add(macdLine);

            // Update Asset
            Asset asset = new Asset(Id = assetId);
            asset.Status = 'Pending Disposal';
            assetsToUpdate.add(asset);

            // Count for OpportunityLineItems
            Asset assetRecord = [SELECT Product2.Line_of_Business__c FROM Asset WHERE Id = :assetId];
            String lob = assetRecord.Product2.Line_of_Business__c;

            if (data.collectionRequired) {
                String collKey = 'COLL - ' + (lob == 'Print' ? 'MP' : 'DW');
                lineItemCounts.put(collKey, lineItemCounts.get(collKey) != null ? lineItemCounts.get(collKey) + 1 : 1);
            }

            if (data.settlement) {
                String setKey = 'SET - ' + (lob == 'Print' ? 'MP' : 'DW');
                lineItemCounts.put(setKey, lineItemCounts.get(setKey) != null ? lineItemCounts.get(setKey) + 1 : 1);
            }
        }

        insert macdLines;
        update assetsToUpdate;

        // Create OpportunityLineItems
        List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();
        for (String key : lineItemCounts.keySet()) {
            String pbeKey = key + '_' + acc.CurrencyIsoCode;
            if (pricebookEntries.containsKey(pbeKey)) {
                OpportunityLineItem oli = new OpportunityLineItem();
                oli.OpportunityId = opp.Id;
                oli.PricebookEntryId = pricebookEntries.get(pbeKey).Id;
                oli.Quantity = lineItemCounts.get(key);
                oli.UnitPrice = 0;
                oppLineItems.add(oli);
            }
        }
        if (!oppLineItems.isEmpty()) {
            insert oppLineItems;
        }

        // Link uploaded files to Opportunity
        if (data.uploadedFileIds != null && !data.uploadedFileIds.isEmpty()) {
            List<ContentDocumentLink> docLinks = new List<ContentDocumentLink>();
            for (Id docId : data.uploadedFileIds) {
                ContentDocumentLink link = new ContentDocumentLink();
                link.ContentDocumentId = docId;
                link.LinkedEntityId = opp.Id;
                link.ShareType = 'V';
                link.Visibility = 'AllUsers';
                docLinks.add(link);
            }
            insert docLinks;
        }
    }
}