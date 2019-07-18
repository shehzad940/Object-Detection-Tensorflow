import React from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default class CanvasFrame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.videoRef = React.createRef();
        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const webCamPromise = navigator.mediaDevices
                .getUserMedia({
                    audio: false,
                    video: {
                        facingMode: 'user'
                    }
                })
                .then(stream => {
                    window.stream = stream;
                    this.videoRef.current.srcObject = stream;
                    return new Promise((resolve, reject) => {
                        this.videoRef.current.onloadedmetadata = () => {
                            resolve();
                        };
                    });
                });
            const modelPromise = cocoSsd.load();
            Promise.all([modelPromise, webCamPromise])
                .then(values => {
                    this.detectFrame(this.videoRef.current, values[0]);
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            alert('Video not supported.');
        }
    }

    detectFrame = (video, model) => {
        model.detect(video).then(predictions => {
            this.renderPredictions(predictions);
            requestAnimationFrame(() => {
                this.detectFrame(video, model);
            });
        });
    };

    renderPredictions = predictions => {
        const ctx = this.canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Font options.
        const font = '16px arial';
        ctx.font = font;
        ctx.textBaseline = 'top';
        predictions.forEach(prediction => {
            const x = prediction.bbox[0];
            const y = prediction.bbox[1];
            const width = prediction.bbox[2];
            const height = prediction.bbox[3];

            // Draw the bounding box.
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Render detected text & accuracy
            ctx.fillStyle = '#000000';
            ctx.fillText(prediction.class, x, y);
            let score = (prediction.score && prediction.score.toFixed(2)) || 0;
            let scoreText = score * 100 + '%';
            ctx.fillText(scoreText, x, y + 20);
        });
    };

    render() {
        return (
            <div className='main-container'>
                <video className='video' autoPlay muted ref={this.videoRef} width='600' height='500' />
                <canvas className='video' ref={this.canvasRef} width='600' height='500' />
            </div>
        );
    }
}
