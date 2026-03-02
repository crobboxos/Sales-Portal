@isTest(SeeAllData=true)
public with sharing class TestShippingLabelController {
    public TestShippingLabelController() {

    }


    static testMethod void checkVFPage(){

        list<SCMC__Shipping__c> ships = [SELECT Id FROM SCMC__Shipping__c LIMIT 2];
        ApexPages.StandardSetController stdSetController = new ApexPages.StandardSetController(ships);
     
		stdSetController.setSelected(ships);
		ShippingLabelController ship = new ShippingLabelController(stdSetController); 
        Map<Id,List<SCMC__Pick_list_Detail__c>> nMap = ship.compileMapInfo;
        try{
            Map<String,Object> plannedTotal = ship.compilePlannedTotal;
        } catch (exception e){

        }
        
        try{
            Map<String,Object> actualTotal = ship.compileActualTotal;
        } catch(Exception ex){

        }
        
    }

    // @TestSetup
    // static void makeData(){

    //     SCMC__Sales_Order__c salesOrder = new SCMC__Sales_Order__c();
    //     salesOrder.Name = 'TEST';
    //     Insert salesOrder;

    //     SCMC__Shipping__c ship = new SCMC__Shipping__c();
       
    //     ship.SCMC__Package_Type__c = 'Box';
    //     insert ship;

    //     SCMC__Picklist__c pick = new SCMC__Picklist__c();
    //     pick.SCMC__Shipper__c = ship.Id;
    //     pick.CurrencyIsoCode = 'GBP';
    //     insert pick;

    //     SCMC__Pick_list_Detail__c pickDetail = new SCMC__Pick_list_Detail__c();
    //     pickDetail.SCMC__Picklist__c = pick.Id;
    //     pickDetail.SCMC__Quantity__c = 2;

    //     insert pickDetail;
        
    // }
}