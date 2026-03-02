public class ShippingLabelController {
    
    public List<SCMC__Shipping__c > shipments {get;private set;}
    public Map<Id,List<SCMC__Pick_list_Detail__c>> idMap {get;set;}
    public Map<String,Object> plannedMap {get;set;} 
    public Map<String,Object> actualMap {get;set;}
    public List<SCMC__Pick_list_Detail__c> picklistDetail = new List<SCMC__Pick_list_Detail__c>();
    Map<Id,List<SCMC__Pick_list_Detail__c>> tempMap = new Map<Id,List<SCMC__Pick_list_Detail__c>>();
    public Set<Id> recIds = new Set<Id>();
    
    public ShippingLabelController(ApexPages.StandardSetController stdSetController){
        // Returns all selected records
        Shipments = (List<SCMC__Shipping__c>) stdSetController.getSelected();
        Map<String,Object> tempPlannedMap = new Map<String,Object>();
    	Map<String,Object> tempActualMap = new Map<String,Object>();
        Set<Id> recIds = new Set<Id>();
            for(SCMC__Shipping__c s: shipments){
                recIds.add(s.Id);
                List<SCMC__Pick_list_Detail__c> tempList = new List<SCMC__Pick_list_Detail__c>();
                tempMap.put(s.Id,tempList);
                tempPlannedMap.put(s.Id, 0);
                tempActualMap.put(s.Id, 0);
            }
        plannedMap = tempPlannedMap;
        actualMap = tempActualMap;
        system.debug('recIds ' + recIds);
        picklistDetail = [Select Id, Name,SCMC__Quantity__c , SCMC__Sales_Order_Line_Item__c, SCMC__Sales_Order_Line_Item__r.SCMC__Quantity__c ,
                                                          SCMC__Sales_Order_Line_Item__r.SCMC__Unit_of_Measure__c ,SCMC__Sales_Order_Line_Item__r.SCMC__Condition_Code__r.Name,SCMC__Sales_Order_Line_Item__r.SCMC__Condition_Code__c   ,
                                                          SCMC__Sales_Order_Line_Item__r.SCMC__Item_Description__c, SCMC__Picklist__r.SCMC__Shipper__c,
                          								  SCMC__Inventory_Detail__r.SCMC__Location__c ,SCMC__Inventory_Detail__r.Position_In_Warehouse__c ,Lot_and_Serial_Numbers__c, 
                         								 SCMC__Inventory_Detail__r.SCMC__Quantity__c 
                                                          FROM SCMC__Pick_list_Detail__c 
                                                          WHERE SCMC__Picklist__r.SCMC__Shipper__c IN :recIds];
    }
    
    public Map<Id,List<SCMC__Pick_list_Detail__c>> compileMapInfo {
        get {
            system.debug('stdSetController.getSelected() ' + Shipments);
            //Map<Id,List<SCMC__Pick_list_Detail__c>> tempMap = new Map<Id,List<SCMC__Pick_list_Detail__c>>();
            
            Set<Id> lineItemIds = new Set<Id>();
            //Compile Shipper Map
            system.debug('picklistDetail ' + picklistDetail);
            for(SCMC__Pick_list_Detail__c p: picklistDetail){
            	lineItemIds.add(p.SCMC__Sales_Order_Line_Item__c);
            }
            //Map<String,Object> mapOfSerial = querySerialNumbers(lineItemIds);
            
            //Compile Map
            for(SCMC__Pick_list_Detail__c pick: picklistDetail){
                system.debug('pick.SCMC__Picklist__r.SCMC__Shipper__c '+ pick.SCMC__Picklist__r.SCMC__Shipper__c);
                /*if(mapOfSerial.containsKey(pick.SCMC__Sales_Order_Line_Item__c)){
                    system.debug('FOUND MAP OF SERIAL');
                    pick.Lot_and_Serial_Numbers__c = (String) mapOfSerial.get(pick.SCMC__Sales_Order_Line_Item__c);
                }*/
                
                if(tempMap.get(pick.SCMC__Picklist__r.SCMC__Shipper__c) != null){
                    tempMap.get(pick.SCMC__Picklist__r.SCMC__Shipper__c).add(pick);
                } 
            }
            system.debug('tempMap ' + tempMap);
            idMap = tempMap;
            return idMap;
        }
        set;
        
    }
    
    /*public Map<String, Object> querySerialNumbers(Set<Id> lineItemIds){
        List<SCMC__Serial_Number__c> serials = [SELECT Id , SCMC__Sales_Order_Line_Item__c , SCMC__Serial_Number__c FROM SCMC__Serial_Number__c 
                                                WHERE SCMC__Sales_Order_Line_Item__c IN :lineItemIds];
        String start = '<ul style="list-style-type:none;padding: 0;list-style-position: inside;">';
        String endValue = '</ul>';
        Map<String,Object> mapOfSerial = new Map<String,Object>();
        for(SCMC__Serial_Number__c s: serials){
            String body;
            if(mapOfSerial.containsKey(s.SCMC__Sales_Order_Line_Item__c)){
                body = (String) mapOfSerial.get(s.SCMC__Sales_Order_Line_Item__c) + '<br></br>' + s.SCMC__Serial_Number__c;
                //String newBody = '<li>'+ s.SCMC__Serial_Number__c +'</li></ul>';
                /*body = body.replace('</ul>',newBody);*/
                
                
                /*mapOfSerial.put(s.SCMC__Sales_Order_Line_Item__c, body);
            } else {
                //body = start + '<li>'+ s.SCMC__Serial_Number__c +'</li></ul>';
                body = s.SCMC__Serial_Number__c;
                mapOfSerial.put(s.SCMC__Sales_Order_Line_Item__c, body);
            }
        }
        system.debug('mapOF SERIAL ' + mapOfSerial);
        return mapOfSerial;

    }*/
    
    public Map<String,Object> compilePlannedTotal {
        get {
            for(SCMC__Pick_list_Detail__c pick: picklistDetail){
                Decimal tempCount = (Decimal) plannedMap.get(pick.SCMC__Picklist__r.SCMC__Shipper__c);
                tempCount = tempCount + pick.SCMC__Sales_Order_Line_Item__r.SCMC__Quantity__c;
                plannedMap.put(pick.SCMC__Picklist__r.SCMC__Shipper__c, tempCount);
            }
            
            return plannedMap;
        }
        set;
        
    }
    
    public Map<String,Object> compileActualTotal {
        get {
            for(SCMC__Pick_list_Detail__c pick: picklistDetail){
                Decimal tempCount = (Decimal) actualMap.get(pick.SCMC__Picklist__r.SCMC__Shipper__c);
                tempCount = tempCount + pick.SCMC__Quantity__c;
                actualMap.put(pick.SCMC__Picklist__r.SCMC__Shipper__c, tempCount);
            }
            
            return actualMap;
        }
        set;
        
    }
    
    
}