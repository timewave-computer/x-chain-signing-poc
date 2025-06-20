import { type VaultConfig } from "@/context";
import { readContract } from "wagmi/actions";
import type { Config } from "wagmi";
import { formatUnits } from "viem";
import { z } from "zod";

/**
 * Fetches APR data from an API endpoint
 * Should return a ratio (i.e "0.04")
 */
export async function fetchAprFromApi(
  vaultConfig: VaultConfig,
): Promise<string> {
  const {
    url,
    method,
    headers = {},
    body = {},
  } = vaultConfig.aprRequest as {
    type: "api";
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: Record<string, string>;
  };

  try {
    const response = await fetch(url, {
      method: method || "GET",
      headers,
      body:
        method !== "GET" && Object.keys(body).length > 0
          ? JSON.stringify(body)
          : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return z.string().parse(data);
  } catch (error) {
    console.error(
      `Error fetching APR from API for vault ${vaultConfig.vaultId}:`,
      error,
    );
    return "0.00";
  }
}

/**
 * Fetches APR data from a smart contract
 */
export async function fetchAprFromContract(
  vaultConfig: VaultConfig,
  config: Config,
  decimals: number,
): Promise<string> {
  const {
    address,
    abi,
    functionName,
    args = [],
  } = vaultConfig.aprRequest as {
    type: "contract";
    address: string;
    abi: string[];
    functionName: string;
    args?: string[];
  };

  try {
    const fetchedApr = await readContract(config, {
      address: address as `0x${string}`,
      abi: abi,
      functionName,
      args,
    });

    return formatUnits(fetchedApr as bigint, decimals);
  } catch (error) {
    console.error(
      `Error fetching APR from contract for vault ${vaultConfig.vaultId}:`,
      error,
    );
    return "0.00";
  }
}
