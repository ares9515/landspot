import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {clickHandler} from '~sitings~/helpers';

const PopupModalBackDrop = () => <div className='popupmodal-backdrop'/>;
const PopupModalTitle = (props) => {
    const {title, onModalHide, topActionButtons} = props;
    return (
        <div className='popupmodal-header'>
            {topActionButtons
                ? <div className="ellipsis">{title}</div>
                : title
            }

            {topActionButtons &&
            <PopupModalFooter {...props}/>
            }

            {<button className={'button close transparent'} onClick={onModalHide}>
                <i className="fal fa-times"/>
            </button>}
        </div>
    );
};

const PopupModalBody = ({children, modalBodyClass}) => (
    <div className={classnames('popupmodal-body', modalBodyClass)}>
        {children}
    </div>
);

const PopupModalFooter = ({
                              hideCancelButton, hideOKButton, okButtonTitle, okButtonDisabled = false,
                              onOK, onModalHide, dialogFooterClassName, customFooterButtons
                          }) => (
    <div className={classnames('popupmodal-footer', dialogFooterClassName)}>
        {
            !hideCancelButton &&
            <a href='#0'
               className={'cancel'}
               onClick={ e => clickHandler(e, onModalHide)}>Cancel</a>
        }
        {
            customFooterButtons && {...customFooterButtons}
        }
        {
            !hideOKButton &&
            <button className={'button default'}
                    disabled={okButtonDisabled}
                    onClick={onOK}>
                {okButtonTitle || 'OK'}
            </button>
        }
    </div>
);

class PopupModalContent extends Component {
    render() {
        const {dialogClassName, topActionButtons} = this.props;
        return (
            <div
                className={classnames('portal-modal', dialogClassName, topActionButtons ? 'top-action-buttons' : '')}>
                <PopupModalTitle {...this.props}/>
                <PopupModalBody  {...this.props}/>

                {!topActionButtons &&
                <PopupModalFooter {...this.props}
                />
                }
            </div>
        );
    }
}

class PopupModal extends Component {
    static propTypes = {
        customFooterButtons: PropTypes.object,
        dialogClassName: PropTypes.string,
        dialogFooterClassName: PropTypes.string,
        hideCancelButton: PropTypes.bool,
        hideOKButton: PropTypes.bool,
        modalBodyClass: PropTypes.string,
        okButtonDisabled: PropTypes.bool,
        okButtonTitle: PropTypes.string,
        onModalHide: PropTypes.func,
        onOK: PropTypes.func.isRequired,
        title: PropTypes.oneOfType([
            PropTypes.string.isRequired,
            PropTypes.array.isRequired,
            PropTypes.object.isRequired,
        ]),
        topActionButtons: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.state = {};
        const rootElement = document.createElement('div');
        document.body.appendChild(rootElement);
        this.rootElement = rootElement;
    }

    componentDidMount() {
        document.body.classList.add('modal-opened');
    }

    componentWillUnmount() {
        document.body.classList.remove('modal-opened');
        document.body.removeChild(this.rootElement);
    }

    dismissModal = () => {
        ReactDOM.unmountComponentAtNode(this.rootElement);
    };


    render() {
        const {onModalHide, ...props} = this.props;

        return (
            ReactDOM.createPortal(
                <React.Fragment>
                    <PopupModalBackDrop/>
                    <PopupModalContent
                        onModalHide={onModalHide || this.dismissModal}
                        {...props}/>
                </React.Fragment>,
                this.rootElement
            )
        );
    }
}

const ConfirmDialog = ({onConfirm, userActionData, onCancel, children}) => (
    <PopupModal title="Confirm action"
                onOK={() => onConfirm(userActionData)}
                onModalHide={onCancel}>
        {children}
    </PopupModal>
);

ConfirmDialog.propTypes = {
    userActionData: PropTypes.oneOfType([
        PropTypes.shape({
            itemName: PropTypes.string,
            itemType: PropTypes.string
        })
    ]),
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

const ConfirmDeleteDialog = (props) => (
    <ConfirmDialog {...props}>
        <p>Are you sure wish to delete {props.userActionData.itemType} <b>{props.userActionData.itemName}</b>?</p>
    </ConfirmDialog>
);

ConfirmDeleteDialog.propTypes = {
    userActionData: PropTypes.oneOfType([
        PropTypes.shape({
            itemName: PropTypes.string.isRequired,
            itemType: PropTypes.string
        })
    ]),
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export {PopupModal, ConfirmDeleteDialog, ConfirmDialog};