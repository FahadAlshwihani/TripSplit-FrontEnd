import {useCallback,useEffect,useRef,useState} from 'react';
export default function useRouteResource(loader,key){
 const loaderRef=useRef(loader);loaderRef.current=loader;
 const stableKey=JSON.stringify(key);
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null);
 const load=useCallback(async()=>{void stableKey;setLoading(true);setError(null);try{setData(await loaderRef.current());}catch(reason){setError(reason);}finally{setLoading(false);}},[stableKey]);
 useEffect(()=>{load();},[load]);
 return {data,setData,loading,error,retry:load};
}
