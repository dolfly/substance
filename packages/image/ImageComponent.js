import NodeComponent from '../../ui/NodeComponent'
import percentage from '../../util/percentage'

class ImageComponent extends NodeComponent {

  didMount() {
    super.didMount.call(this)
    let node = this.props.node
    node.on('src:changed', this.rerender, this)
    // TODO: we should try to factor this out for reuse
    node.on('upload:started', this.onUploadStarted, this)
    node.on('upload:progress', this.onUploadProgress, this)
    node.on('upload:finished', this.onUploadFinished, this)
  }

  dispose() {
    super.dispose.call(this)

    this.props.node.off(this)
  }

  render($$) {
    let el = super.render.call(this, $$)
    el.addClass('sc-image')

    el.append(
      $$('img').attr({
        src: this.props.node.src,
      }).ref('image')
    )

    if (this.state.uploading) {
      let progressBar = $$('div')
        .addClass('se-progress-bar')
        .ref('progressBar')
        .append('Uploading: ' + percentage(this.state.progress));
      el.append(progressBar)
    }

    return el
  }

  onUploadStarted() {
    this.setState({ uploading: true, progress: 0 })
  }

  onUploadProgress(progress) {
    this.setState({ uploading: true, progress: progress })
  }

  onUploadFinished() {
    this.setState({})
  }

}

export default ImageComponent
