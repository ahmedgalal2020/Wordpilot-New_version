import { DictationWorkspaceView } from './DictationWorkspaceView';
import { useDictationWorkspace } from './useDictationWorkspace';

export default function DictationWorkspace() {
  const workspace = useDictationWorkspace();
  return <DictationWorkspaceView workspace={workspace} />;
}
