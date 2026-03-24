import React from 'react';
import useIsMobile from './common/useIsMobile';
import { useDummyTripSheetLogic } from '../hooks/compliance/useDummyTripSheetLogic';
import DummyTripSheetDesktop from './DummyTripSheetDesktop';
import DummyTripSheetMobile from './DummyTripSheetMobile';
import Loader from './common/Loader';
import { ToastContainer } from 'react-toastify';

const DummyTripSheet = () => {
    const isMobile = useIsMobile();
    const logicProps = useDummyTripSheetLogic();
    const { isDataLoading } = logicProps;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Loader isVisible={isDataLoading} fullScreen={true} />
            
            {isMobile ? (
                <DummyTripSheetMobile {...logicProps} />
            ) : (
                <DummyTripSheetDesktop {...logicProps} />
            )}
        </>
    );
};

export default DummyTripSheet;