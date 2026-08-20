import React from'react';import{useTranslation}from'react-i18next';
export default function FundLifecycleActions({isOwner,status,onClose}){const{t}=useTranslation();return isOwner&&status==='active'?<button onClick={onClose}>{t('fund.close')}</button>:null}
