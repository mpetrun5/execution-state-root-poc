import {CompactMultiProof, computeDescriptor, createNodeFromProof, Proof, ProofType, SingleProof, Tree} from "@chainsafe/persistent-merkle-tree";
import {toHexString} from "@chainsafe/ssz";
import {getClient} from "@lodestar/api";
import {config} from "@lodestar/config/default"
import { ssz } from "@lodestar/types/bellatrix";
import { hash, verifyMerkleBranch } from "@lodestar/utils";

const BEACON_API_URL = "https://lodestar-mainnet.chainsafe.io";
const EXECUTION_STATE_ROOT_GINDEX = BigInt(3218);
const SLOT = 7330751;
const ETHERSCAN_BLOCK = "https://etherscan.io/block/18142611";

export async function getExecutionStateRootProof(): Promise<Proof> {
  const api = getClient(
    {
      urls: [BEACON_API_URL],
    },
    {
      config: config,
    }
  );
  const blockRoot = "0x272be0dfaaf7748680acd4224f5d51163573852fe82b9013039e73349c16dc28";
  const executionStateRoot = "0x5383d7747ab5f0af4f506fa7ddf932ad48367e2de5aa41fa4717e55a950ece31";
  const descriptor = computeDescriptor([EXECUTION_STATE_ROOT_GINDEX]);

  const res = await api.proof.getBlockProof(blockRoot, descriptor);
  const tree = Tree.createFromProof(res.response?.data as CompactMultiProof);
  const stateRootNode = tree.getNode(EXECUTION_STATE_ROOT_GINDEX);
  if (toHexString(stateRootNode.root) !== executionStateRoot) {
    throw new Error(`Invalid execution state root ${toHexString(stateRootNode.root)} expected ${executionStateRoot}`);
  }

  const proof: SingleProof = tree.getProof({
    type: ProofType.single,
    gindex: EXECUTION_STATE_ROOT_GINDEX,
  }) as SingleProof;
 if (toHexString(createNodeFromProof(proof).root) !== blockRoot) {
  throw new Error("Invalid proof")
 }

  return proof;
}

getExecutionStateRootProof()
  .then((proof: SingleProof) => {
    const hexWitnesses = []
    for (const witness of proof.witnesses.reverse()) {
      hexWitnesses.push(toHexString(witness))
    }
    console.log(hexWitnesses);
  })
  .catch((e: Error) => {
    console.error(e);
  });
