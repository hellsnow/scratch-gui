import AudioEngine from 'scratch-audio';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {openExtensionLibrary} from '../reducers/modals';
import {setProjectTitle} from '../reducers/project-title';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import {
    closeCostumeLibrary,
    closeBackdropLibrary
} from '../reducers/modals';

import ProjectLoaderHOC from '../lib/project-loader-hoc.jsx';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';

class GUI extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            loading: !props.vm.initialized,
            loadingError: false,
            errorMessage: ''
        };
    }
    componentDidMount () {
        if (this.props.projectTitle) {
            this.props.onUpdateReduxProjectTitle(this.props.projectTitle);
        }

        if (this.props.vm.initialized) return;
        this.audioEngine = new AudioEngine();
        this.props.vm.attachAudioEngine(this.audioEngine);
        this.props.vm.loadProject(this.props.projectData)
            .then(() => {
                this.setState({loading: false}, () => {
                    this.props.vm.setCompatibilityMode(true);
                    this.props.vm.start();
                });
            })
            .catch(e => {
                // Need to catch this error and update component state so that
                // error page gets rendered if project failed to load
                this.setState({loadingError: true, errorMessage: e});
            });
        this.props.vm.initialized = true;
    }
    componentWillReceiveProps (nextProps) {
        if (this.props.projectData !== nextProps.projectData) {
            this.setState({loading: true}, () => {
                this.props.vm.loadProject(nextProps.projectData)
                    .then(() => {
                        this.setState({loading: false});
                    })
                    .catch(e => {
                        // Need to catch this error and update component state so that
                        // error page gets rendered if project failed to load
                        this.setState({loadingError: true, errorMessage: e});
                    });
            });
        }
        if (this.props.projectTitle !== nextProps.projectTitle) {
            this.props.onUpdateReduxProjectTitle(nextProps.projectTitle);
        }
    }
    render () {
        if (this.state.loadingError) {
            throw new Error(
                `Failed to load project from server [id=${window.location.hash}]: ${this.state.errorMessage}`);
        }
        const {
            /* eslint-disable no-unused-vars */
            assetHost,
            hideIntro,
            onUpdateReduxProjectTitle,
            projectData,
            projectHost,
            projectTitle,
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            loadingStateVisible,
            vm,
            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || this.state.loading || loadingStateVisible}
                vm={vm}
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    fetchingProject: PropTypes.bool,
    hideIntro: PropTypes.bool,
    importInfoVisible: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onSeeCommunity: PropTypes.func,
    onUpdateProjectTitle: PropTypes.func,
    onUpdateReduxProjectTitle: PropTypes.func,
    previewInfoVisible: PropTypes.bool,
    projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    projectHost: PropTypes.string,
    projectTitle: PropTypes.string,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = (state, ownProps) => ({
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
    alertsVisible: state.scratchGui.alerts.visible,
    backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
    blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
    cardsVisible: state.scratchGui.cards.visible,
    costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
    costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
    importInfoVisible: state.scratchGui.modals.importInfo,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    loadingStateVisible: state.scratchGui.modals.loadingProject,
    previewInfoVisible: state.scratchGui.modals.previewInfo && !ownProps.hideIntro,
    targetIsStage: (
        state.scratchGui.targets.stage &&
        state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
    ),
    soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
    tipsLibraryVisible: state.scratchGui.modals.tipsLibrary
});

const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onUpdateReduxProjectTitle: title => dispatch(setProjectTitle(title))
});

const ConnectedGUI = connect(
    mapStateToProps,
    mapDispatchToProps,
)(GUI);

const WrappedGui = ErrorBoundaryHOC('Top Level App')(
    ProjectLoaderHOC(vmListenerHOC(ConnectedGUI))
);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;
