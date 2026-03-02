public class agxBankHoliday {
    List<Holiday> holidays = null; 
    
    public Date processDate {get;set;}
    public Date expireDate {get;set;}
    
    public String myStringValue {get;set;}
    public String myFormatedValue {get;set;}
    
    public agxBankHoliday(){
        try
        {
        	holidays = [Select h.StartTimeInMinutes, h.Name, h.ActivityDate From Holiday h];
        } catch(Exception e){
            System.debug(e);
            List<Holiday> ret = new List<Holiday>();
            ret.Add(new Holiday(StartTimeInMinutes = 0, Name='', ActivityDate = Date.NewInstance(1994,1,1)));
            holidays = ret;
        }
    }
    
    private Date checkThisDate(Date dateIn){
        Date proposedDate = dateIn;
        Datetime dt = proposedDate;
        String day=dt.format('EEEE');
        
        Date retDate=proposedDate;
        if(day=='Friday')
            proposedDate = proposedDate.addDays(3);
        if(day=='Saturday')
            proposedDate = proposedDate.addDays(2);
        if(day=='Sunday')
            proposedDate = proposedDate.addDays(1);
        
        retDate = proposedDate;
        for(Holiday hDay:holidays){
            if(proposedDate.daysBetween(hDay.ActivityDate)==0){
            	retDate = proposedDate.addDays(1);
                proposedDate = retDate;
            }        
        }
        
        return retDate;        
    }
    
    public void getProcessingDate(){
        Date proposedDate = (system.today()).addDays(1);
        processDate = checkThisDate(proposedDate);
        Date propexpdate = processDate.addDays(1);
        expireDate = checkThisDate(propexpdate);
    }

    public void removeSpecialChars(){
        //String name = '{B]@i%s*w:?,-a$j#e)e(t! S^a.m}a]l[';
        //BiswajeetSamal
        myFormatedValue = myStringValue.replaceAll('[^a-zA-Z0-9\\s+]', '');       
    }    
}