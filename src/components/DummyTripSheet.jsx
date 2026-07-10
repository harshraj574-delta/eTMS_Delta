import React from 'react';
import useIsMobile from './common/useIsMobile';
import { useDummyTripSheetLogic } from '../hooks/compliance/useDummyTripSheetLogic';
import DummyTripSheetDesktop from './DummyTripSheetDesktop';
import DummyTripSheetMobile from './DummyTripSheetMobile';
import Loader from './common/Loader';

const DummyTripSheet = () => {
    const isMobile = useIsMobile();
    const logicProps = useDummyTripSheetLogic();
    const { isDataLoading } = logicProps;

    return (
        <>
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