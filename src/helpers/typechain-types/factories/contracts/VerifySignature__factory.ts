/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import type { Provider, TransactionRequest } from '@ethersproject/providers';
import type { PromiseOrValue } from '../../common';
import type {
  VerifySignature,
  VerifySignatureInterface,
} from '../../contracts/VerifySignature';

const _abi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_messageHash',
        type: 'bytes32',
      },
    ],
    name: 'getEthSignedMessageHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_collection',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_floorPrice',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_blockNumber',
        type: 'uint256',
      },
    ],
    name: 'getMessageHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_ethSignedMessageHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'recoverSigner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'sig',
        type: 'bytes',
      },
    ],
    name: 'splitSignature',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_signer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_collection',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_floorPrice',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_blockNumber',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'verify',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
];

const _bytecode =
  '0x608060405234801561001057600080fd5b5061052b806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c806397aba7f91461005c578063a7bb58031461008c578063cffc18eb146100bd578063d2b0737b146100e0578063fa54080114610101575b600080fd5b61006f61006a366004610397565b610114565b6040516001600160a01b0390911681526020015b60405180910390f35b61009f61009a3660046103de565b610193565b60408051938452602084019290925260ff1690820152606001610083565b6100d06100cb366004610437565b61020b565b6040519015158152602001610083565b6100f36100ee3660046104a9565b610252565b604051908152602001610083565b6100f361010f3660046104dc565b6102a1565b60008060008061012385610193565b6040805160008152602081018083528b905260ff8316918101919091526060810184905260808101839052929550909350915060019060a0016020604051602081039080840390855afa15801561017e573d6000803e3d6000fd5b5050604051601f190151979650505050505050565b600080600083516041146101ed5760405162461bcd60e51b815260206004820152601860248201527f696e76616c6964207369676e6174757265206c656e6774680000000000000000604482015260640160405180910390fd5b50505060208101516040820151606090920151909260009190911a90565b600080610219868686610252565b90506000610226826102a1565b9050876001600160a01b031661023c8286610114565b6001600160a01b03161498975050505050505050565b6040516bffffffffffffffffffffffff19606085901b16602082015260348101839052605481018290526000906074016040516020818303038152906040528051906020012090509392505050565b6040517f19457468657265756d205369676e6564204d6573736167653a0a3332000000006020820152603c8101829052600090605c01604051602081830303815290604052805190602001209050919050565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261031b57600080fd5b813567ffffffffffffffff80821115610336576103366102f4565b604051601f8301601f19908116603f0116810190828211818310171561035e5761035e6102f4565b8160405283815286602085880101111561037757600080fd5b836020870160208301376000602085830101528094505050505092915050565b600080604083850312156103aa57600080fd5b82359150602083013567ffffffffffffffff8111156103c857600080fd5b6103d48582860161030a565b9150509250929050565b6000602082840312156103f057600080fd5b813567ffffffffffffffff81111561040757600080fd5b6104138482850161030a565b949350505050565b80356001600160a01b038116811461043257600080fd5b919050565b600080600080600060a0868803121561044f57600080fd5b6104588661041b565b94506104666020870161041b565b93506040860135925060608601359150608086013567ffffffffffffffff81111561049057600080fd5b61049c8882890161030a565b9150509295509295909350565b6000806000606084860312156104be57600080fd5b6104c78461041b565b95602085013595506040909401359392505050565b6000602082840312156104ee57600080fd5b503591905056fea264697066735822122017d6356969241a6d4e69db765c3246d3167430c46d595ee26280a6a0f2d7258964736f6c63430008110033';

type VerifySignatureConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: VerifySignatureConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class VerifySignature__factory extends ContractFactory {
  constructor(...args: VerifySignatureConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> },
  ): Promise<VerifySignature> {
    return super.deploy(overrides || {}) as Promise<VerifySignature>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): VerifySignature {
    return super.attach(address) as VerifySignature;
  }
  override connect(signer: Signer): VerifySignature__factory {
    return super.connect(signer) as VerifySignature__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): VerifySignatureInterface {
    return new utils.Interface(_abi) as VerifySignatureInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): VerifySignature {
    return new Contract(address, _abi, signerOrProvider) as VerifySignature;
  }
}
