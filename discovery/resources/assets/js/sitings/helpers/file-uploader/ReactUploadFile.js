/**
 * https://github.com/wubocong/react-upload-file + a lot of fixes
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class ReactUploadFile extends Component {
    static propTypes = {
        options: PropTypes.shape({
            /* basics*/
            baseUrl: PropTypes.string.isRequired,
            query: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
            body: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
            dataType: PropTypes.string,
            timeout: PropTypes.number,
            numberLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
            fileFieldName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
            withCredentials: PropTypes.bool,
            requestHeaders: PropTypes.object,
            accept: PropTypes.string,
            multiple: PropTypes.bool,
            /* funcs*/
            beforeChoose: PropTypes.func,
            didChoose: PropTypes.func,
            beforeUpload: PropTypes.func,
            didUpload: PropTypes.func,
            uploading: PropTypes.func,
            uploadSuccess: PropTypes.func,
            uploadError: PropTypes.func,
            uploadFail: PropTypes.func,
            onAbort: PropTypes.func,
            onProgress: PropTypes.func,
        }).isRequired,
        style: PropTypes.object,
        /* buttons*/
        chooseFileButton: PropTypes.element.isRequired,
        uploadFileButton: PropTypes.element,
    };

    static defaultProps = {
        /* buttons*/
        chooseFileButton: <button>Select File</button>,
    };

    constructor(props) {
        super(props);
        const emptyFunction = f => f;
        const options = {
            dataType: 'json',
            timeout: 0,
            numberLimit: 0,
            multiple: false,
            withCredentials: false,
            beforeChoose: emptyFunction,
            didChoose: emptyFunction,
            beforeUpload: emptyFunction,
            didUpload: emptyFunction,
            uploading: emptyFunction,
            uploadSuccess: emptyFunction,
            uploadError: emptyFunction,
            uploadFail: emptyFunction,
            onAbort: emptyFunction,
            ...props.options,
        };
        const timeout = parseInt(options.timeout, 10);
        options.timeout = (Number.isInteger(timeout) && timeout > 0) ? timeout : 0;

        const dataType = options.dataType && options.dataType.toLowerCase();
        options.dataType = (dataType !== 'json' && 'text') || dataType;

        /* copy options to instance */
        Object.keys(options).forEach((key) => {
            this[key] = options[key];
        });
    }

    state = {
        /* xhrs' list after start uploading files */
        xhrList: [],
        currentXHRId: 0,
    };

    componentDidMount = () => {
    }

    /* trigger input's click*/
    /* trigger beforeChoose*/
    commonChooseFile = (e) => {
        if (e.target.name !== 'ajax-upload-file-input') {
            const jud = this.beforeChoose();
            if (jud !== true && jud !== undefined) {
                return;
            }
            this.input.click();
        }
    };

    /* input change event with File API */
    /* trigger chooseFile */
    commonChangeFile = (e) => {
        this.files = this.input.files;
        this.didChoose(this.files);

        /* immediately upload files */
        if (!this.props.uploadFileButton) {
            this.commonUploadFile(e);
        }
    };

    /* execute upload */
    commonUploadFile = (e) => {
        if (!this.files || !this.files.length) {
            return false;
        }
        if (!this.baseUrl) {
            throw new Error('baseUrl missed in options');
        }

        const jud = e === true ? true : this.beforeUpload(this.files);
        if (!jud) {
            return false;
        }

        let formData = new FormData();
        formData = this.appendFieldsToFormData(formData);

        const fieldNameType = typeof this.fileFieldName;
        const numberLimit = this.numberLimit === 0 ? this.files.length : Math.min(this.files.length, this.numberLimit);

        for (let i = numberLimit - 1; i >= 0; i--) {
            if (fieldNameType === 'function') {
                const file = this.files[i];
                const fileFieldName = this.fileFieldName(file);
                formData.append(fileFieldName, file);
            } else if (fieldNameType === 'string') {
                const file = this.files[i];
                formData.append(this.fileFieldName, file);
            } else {
                const file = this.files[i];
                formData.append(file.name, file);
            }
        }

        let baseUrl = this.baseUrl;
        /* url query*/
        const query = typeof this.query === 'function' ? this.query(this.files) : this.query;
        const pos = baseUrl.indexOf('?');
        let queryStr;
        if (pos > -1) {
            queryStr = baseUrl.substring(pos);
            baseUrl = baseUrl.substring(0, pos);
        }
        if (query) {
            if (queryStr) {
                console.warn('Your url contains query string, which will be ignored when options.query is set.');
            }
            const queryArr = [];
            Object.keys(query).forEach(key => queryArr.push(`${key}=${query[key]}`)
            );
            queryStr = `?${queryArr.join('&')}`;
        }
        queryStr = queryStr || '';
        const targetUrl = `${baseUrl}${queryStr}`;

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => this.onProgress(event);
        
        xhr.open('post', targetUrl, true);
        
        /* authorization info for cross-domain */
        xhr.withCredentials = this.withCredentials;

        const rh = this.requestHeaders;
        if (rh) {
            Object.keys(rh).forEach(key => xhr.setRequestHeader(key, rh[key]));
        }

        if (this.timeout) {
            xhr.timeout = this.timeout;
            xhr.addEventListener('timeout', () => {
                this.uploadError({
                    type: '408',
                    message: 'Request Timeout',
                });
            });
            setTimeout(() => {
            }, this.timeout);
        }

        xhr.addEventListener('load', () => {
            if (this.input) {
                this.input.value = '';
            }
            let res = null;

            if (this.dataType === 'json') {
                try {
                    res = JSON.parse(xhr.responseText);
                } catch (e) {

                }
            } else {
                res = xhr.responseText;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                this.uploadSuccess(res);
            } else {
                this.uploadError(res);
            }
        });

        xhr.addEventListener('error', () => {
            let err;
            if (this.dataType === 'json') {
                try {
                    err = JSON.parse(xhr.responseText);
                } catch (e) {

                }
            } else {
                err = xhr.responseText;
            }
            this.uploadError({
                type: err.type,
                message: err.message,
            });
        });

        xhr.addEventListener('progress', (progress) => {
            this.uploading(progress);
        });

        const curId = this.state.xhrList.length - 1;
        xhr.addEventListener('abort', () => {
            this.onAbort(curId);
        });

        xhr.send(formData);

        this.setState({
            currentXHRId: curId,
            xhrList: [...this.state.xhrList, xhr]
        });

        /* trigger didUpload */
        this.didUpload(this.files, this.state.currentXHRId);

        return true;
    }

    /* append text params to formData */
    appendFieldsToFormData = (formData) => {
        const field = typeof this.body === 'function' ? this.body() : this.body;
        if (field) {
            Object.keys(field).forEach((index) => {
                formData.append(index, field[index]);
            });
        }
        return formData;
    }

    /**
     * public method. Manually process files
     * @param func(files)
     * @return files
     * Filelist:
     * {
     *   0: file,
     *   1: file,
     *   length: 2
     * }
     */
    processFile = (func) => {
        this.files = func(this.files);
    }

    /* public method. Manually trigger commonChooseFile for debug */
    manuallyChooseFile = (e) => {
        this.commonChooseFile(e);
    }

    /* public method. Manually trigger commonUploadFile to upload files */
    manuallyUploadFile = (files) => {
        this.files = files && files.length ? files : this.files;
        this.commonUploadFile(true);
    }

    /* public method. Abort a xhr by id which didUpload has returned, default the last one */
    abort = (id) => {
        if (id) {
            this.state.xhrList[id].abort();
        } else {
            this.state.xhrList[this.state.currentXHRId].abort();
        }
    }

    render() {
        const inputProps = {
            accept: this.props.options.accept,
            multiple: this.props.options.multiple
        };
        const chooseFileButton = React.cloneElement(
            this.props.chooseFileButton, {
                onClick: this.commonChooseFile
            },
            [...(this.props.chooseFileButton.props.children ? [this.props.chooseFileButton.props.children] : []), (
                <input type="file"
                       name="ajax-upload-file-input"
                       style={{display: 'none'}}
                       onChange={this.commonChangeFile}
                       {...inputProps}
                       key="file-button"
                       ref={node => this.input = node}
                />
            )]);
        const uploadFileButton = this.props.uploadFileButton && React.cloneElement(this.props.uploadFileButton, {
            onClick: this.commonUploadFile
        });
        return (
            <React.Fragment>
                {chooseFileButton}
                {uploadFileButton}
            </React.Fragment>
        );
    }
}
