import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import api from "../../api";
import MedicalSupervisorLayout from "./components/MedicalSupervisorLayout";
import Overview from "./components/Overview";
import DiseaseReports from "./components/DiseaseReports";
import WeeklyMonitoring from "./components/WeeklyMonitoring";
import RiskMap from "./components/RiskMap";
import SurveillanceAnalytics from "./components/SurveillanceAnalytics";
import AgentOversight from "./components/AgentOversight";
import Alerts from "./components/Alerts";
import HomeReliefManagement from "./HomeReliefManagement";
import { Loading } from "./components/MedicalUi";

export default function MedicalSupervisorPortal({ onExit }) {
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [data,setData]=useState({overview:null,reports:[],monitoring:[],analytics:null,riskMap:[],emerging:[],agents:[],issues:[],diseases:[]});

  const load=useCallback(async(showSpinner=true)=>{
    try{
      setError(""); if(showSpinner)setRefreshing(true);
      const [overview,reports,monitoring,analytics,riskMap,emerging,agents,issues,diseases]=await Promise.all([
        api.getMedicalOverview(),api.getMedicalReports(),api.getMedicalMonitoring(),api.getMedicalAnalytics(8),api.getMedicalRiskMap(),api.getMedicalEmergingDiseases(),api.getSupervisorAgents(),api.getSupervisorAgentIssues(),api.getMedicalDiseases()
      ]);
      setData({overview,reports:Array.isArray(reports)?reports:[],monitoring:Array.isArray(monitoring)?monitoring:[],analytics,riskMap:Array.isArray(riskMap)?riskMap:[],emerging:Array.isArray(emerging)?emerging:[],agents:Array.isArray(agents)?agents:[],issues:Array.isArray(issues)?issues:[],diseases:Array.isArray(diseases)?diseases:[]});
    }catch(e){setError(e?.message||"Unable to load Medical Supervisor data.");}
    finally{setLoading(false);setRefreshing(false);}
  },[]);
  useEffect(()=>{load(true)},[load]);

  const remindAgent=async(agent)=>{await api.remindSupervisorAgent(agent.id);await load(false)};
  const submitIssue=async(payload)=>{await api.submitAgentIssue(payload);await load(false)};
  const reviewEmerging=async(id,decision,notes,extra={})=>{await api.reviewEmergingDisease(id,{decision,review_notes:notes||"",...extra});await load(false)};

  const alertCount=(data.overview?.high_risk_alerts||0)+(data.overview?.pending_emerging_reviews||0)+(data.overview?.pending_agent_submissions||0);
  const districtName=data.overview?.supervisor_district?.name || data.overview?.district?.name || "Kodagu District";

  return <MedicalSupervisorLayout activeTab={tab} onTabChange={setTab} onExit={onExit} alertCount={alertCount} districtName={districtName}>
    {error&&<div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#F0CACA] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#C62828]"><div className="flex items-center gap-2"><AlertCircle size={15}/>{error}</div><button onClick={()=>load(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#F0CACA] bg-white px-3 py-2 font-semibold"><RefreshCw size={13} className={refreshing?"animate-spin":""}/> Retry</button></div>}
    {tab!=="home-relief"&&<div className="mb-3 flex justify-end"><button onClick={()=>load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5E0] bg-white px-3 py-2 text-[10px] font-semibold text-[#52627D] hover:bg-[#F7FAF8]"><RefreshCw size={13} className={refreshing?"animate-spin":""}/> Refresh</button></div>}
    {loading?<Loading/>:tab==="overview"?<Overview data={data.overview} onReports={()=>setTab("reports")} onMonitoring={()=>setTab("monitoring")} onAlerts={()=>setTab("alerts")}/>:tab==="reports"?<DiseaseReports reports={data.reports} onRefresh={()=>load(true)}/>:tab==="monitoring"?<WeeklyMonitoring rows={data.monitoring} onRemind={remindAgent} onRefresh={()=>load(true)}/>:tab==="risk-map"?<RiskMap data={data.riskMap}/>:tab==="analytics"?<SurveillanceAnalytics data={data.analytics}/>:tab==="agents"?<AgentOversight agents={data.agents} issues={data.issues} onSubmitIssue={submitIssue}/>:tab==="alerts"?<Alerts alerts={data.overview?.recent_alerts||[]} emerging={data.emerging} diseases={data.diseases} onReviewEmerging={reviewEmerging}/>:<HomeReliefManagement/>}
  </MedicalSupervisorLayout>;
}
