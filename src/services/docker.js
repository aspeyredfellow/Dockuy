const Docker = require('dockerode');
const os = require('os');
const path = require('path');
const fs = require('fs');
const tar = require('tar-fs');
const config = require('../config');

const isWin = process.platform === 'win32';
const defaultSocket = isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock';

let docker;
try {
    const host = config.DOCKER_HOST;
    if (host && (host.startsWith('http://') || host.startsWith('https://') || host.startsWith('tcp://'))) {
        const cleanHost = host.replace('tcp://', 'http://');
        const url = new URL(cleanHost);
        docker = new Docker({ host: url.hostname, port: url.port });
    } else {
        docker = new Docker({ socketPath: host || defaultSocket });
    }
    docker.ping((err) => {
        if (err) {
            console.error('docker connection failed:', err.message);
        } else {
            console.log('connected to docker daemon');
        }
    });
} catch (error) {
    console.error('failed to initialize docker client:', error.message);
    docker = null;
}

// get all containers
const getAllContainers = async (all = true) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const containers = await docker.listContainers({ all });
        return await Promise.all(containers.map(async c => {
            let memoryLimit = 'No limit';
            try {
                const containerInstance = docker.getContainer(c.Id);
                const info = await containerInstance.inspect();
                const memBytes = info.HostConfig?.Memory || 0;
                if (memBytes > 0) {
                    const mb = Math.round(memBytes / (1024 * 1024));
                    memoryLimit = mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
                }
            } catch (e) {
                // fallback
            }
            return {
                id: c.Id.slice(0, 12),
                name: c.Names[0]?.replace('/', '') || 'unnamed',
                image: c.Image,
                status: c.Status,
                running: c.State === 'running',
                created: c.Created,
                ports: c.Ports,
                memoryLimit,
                labels: c.Labels || {}
            };
        }));
    } catch (error) {
        console.error('error fetching containers:', error);
        throw new Error('Failed to fetch containers: ' + error.message);
    }
};

// get single container
const getContainer = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        const info = await container.inspect();
        
        const portBindings = info.HostConfig?.PortBindings || {};
        const formattedPorts = Object.entries(portBindings).map(([containerPortKey, bindings]) => {
            const containerPort = containerPortKey.split('/')[0];
            const hostPort = bindings?.[0]?.HostPort;
            return hostPort ? `${hostPort}:${containerPort}` : '';
        }).filter(Boolean).join(', ');

        const binds = (info.HostConfig?.Binds || []).join('\n');
        const env = (info.Config?.Env || []).filter(e => !e.startsWith('PATH=')).join('\n');
        const memBytes = info.HostConfig?.Memory || 0;
        const memoryLimitMB = memBytes > 0 ? Math.round(memBytes / (1024 * 1024)) : 0;
        const memoryLimitFormatted = memoryLimitMB > 0 
            ? (memoryLimitMB >= 1024 ? `${(memoryLimitMB / 1024).toFixed(1)} GB` : `${memoryLimitMB} MB`) 
            : 'No limit';

        return {
            id: info.Id.slice(0, 12),
            name: info.Name.replace('/', ''),
            image: info.Config.Image,
            status: info.State.Status,
            running: info.State.Running,
            created: info.Created,
            started: info.State.StartedAt,
            finished: info.State.FinishedAt,
            ports: info.NetworkSettings.Ports || {},
            formattedPorts,
            mounts: info.Mounts || [],
            volumes: binds,
            labels: info.Config.Labels || {},
            env,
            memoryLimit: memoryLimitMB,
            memoryLimitFormatted,
            restartPolicy: info.HostConfig?.RestartPolicy?.Name || 'unless-stopped',
            network: info.NetworkSettings.Networks || {}
        };
    } catch (error) {
        throw new Error('Container not found: ' + error.message);
    }
};

const updateContainer = async (id, config) => {
    if (!docker) throw new Error('Docker not available');

    const container = docker.getContainer(id);
    const info = await container.inspect();
    const oldName = info.Name.replace('/', '');

    // stop and remove existing container
    await container.remove({ force: true });

    // create and start new container with updated parameters
    return await createContainer({
        name: config.name || oldName,
        image: config.image || info.Config.Image,
        ports: config.ports,
        env: config.env,
        volumes: config.volumes,
        restartPolicy: config.restartPolicy,
        memoryLimit: config.memoryLimit,
        autoStart: config.autoStart !== false
    });
};

// start container
const startContainer = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        await container.start();
        return { success: true };
    } catch (error) {
        throw new Error('Failed to start container: ' + error.message);
    }
};

// stop container
const stopContainer = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        await container.stop();
        return { success: true };
    } catch (error) {
        throw new Error('Failed to stop container: ' + error.message);
    }
};

// restart container
const restartContainer = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        await container.restart();
        return { success: true };
    } catch (error) {
        throw new Error('Failed to restart container: ' + error.message);
    }
};

// delete container
const deleteContainer = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        try {
            await container.stop({ t: 2 });
        } catch (e) {
            // container might already be stopped or require force kill
        }
        await container.remove({ force: true, v: true });
        return { success: true };
    } catch (error) {
        throw new Error('Failed to delete container: ' + error.message);
    }
};

// get container logs
const getLogs = async (id, tail = 100) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail,
            timestamps: true
        });
        return logs.toString('utf-8');
    } catch (error) {
        throw new Error('Failed to get logs: ' + error.message);
    }
};

// get container stats
const getStats = async (id) => {
    if (!docker) throw new Error('Docker not available');
    
    try {
        const container = docker.getContainer(id);
        const stats = await container.stats({ stream: false });
        
        // calculate cpu
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        let cpu = 0;
        if (systemDelta > 0 && cpuDelta > 0) {
            const cpuCount = stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
            cpu = (cpuDelta / systemDelta) * cpuCount * 100;
        }
        
        // calculate memory
        const memoryUsage = stats.memory_stats.usage || 0;
        const memoryLimit = stats.memory_stats.limit || 1;
        const memoryPercent = (memoryUsage / memoryLimit) * 100;
        
        // network
        const networks = stats.networks || {};
        const eth = networks.eth0 || {};
        
        return {
            cpu: Math.round(cpu * 100) / 100,
            memory: {
                usage: Math.round(memoryUsage / (1024 * 1024)),
                limit: Math.round(memoryLimit / (1024 * 1024)),
                percent: Math.round(memoryPercent * 100) / 100
            },
            network: {
                rx: eth.rx_bytes || 0,
                tx: eth.tx_bytes || 0
            }
        };
    } catch (error) {
        throw new Error('Failed to get stats: ' + error.message);
    }
};

// get system info
const getSystemInfo = async () => {
    const nodePlatform = os.platform();
    const nodeRelease = os.release();
    const nodeArch = os.arch();
    const nodeCpus = os.cpus()?.length || 1;
    const nodeMemGB = Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10;

    let osName = 'Linux';
    if (nodePlatform === 'win32') osName = 'Windows';
    else if (nodePlatform === 'darwin') osName = 'macOS';
    else if (nodePlatform === 'freebsd' || nodePlatform === 'openbsd') osName = nodePlatform.toUpperCase();

    if (!docker) {
        return {
            containers: 0,
            running: 0,
            stopped: 0,
            paused: 0,
            images: 0,
            cpus: nodeCpus,
            memory: nodeMemGB,
            version: 'N/A',
            os: osName,
            arch: nodeArch,
            kernelVersion: nodeRelease,
            driver: '-',
            dockerRootDir: '-'
        };
    }
    
    try {
        const info = await docker.info();
        
        // accurate os detection across all distros and oses
        let detectedOs = info.OperatingSystem;
        if (!detectedOs || detectedOs === 'Docker Desktop') {
            detectedOs = info.OSType ? `${osName} (${info.OSType})` : osName;
        }

        // accurate kernel detection (docker daemon kernel vs host kernel fallback)
        const detectedKernel = (info.KernelVersion && info.KernelVersion.trim() !== '')
            ? info.KernelVersion
            : (nodeRelease || '-');

        // accurate architecture detection
        const detectedArch = info.Architecture || nodeArch;

        // accurate cpu and memory
        const totalCpus = info.NCPU || nodeCpus;
        const totalMem = info.MemTotal ? (Math.round((info.MemTotal / (1024 * 1024 * 1024)) * 10) / 10) : nodeMemGB;

        return {
            containers: info.Containers || 0,
            running: info.ContainersRunning || 0,
            stopped: info.ContainersStopped || 0,
            paused: info.ContainersPaused || 0,
            images: info.Images || 0,
            cpus: totalCpus,
            memory: totalMem,
            version: info.ServerVersion || 'unknown',
            os: detectedOs,
            arch: detectedArch,
            kernelVersion: detectedKernel,
            driver: info.Driver || 'overlay2',
            dockerRootDir: info.DockerRootDir || (isWin ? 'C:\\ProgramData\\Docker' : '/var/lib/docker')
        };
    } catch (error) {
        throw new Error('Failed to get system info: ' + error.message);
    }
};

const parseMemoryLimit = (input) => {
    if (!input) return 0;
    if (typeof input === 'number') return Math.max(0, input * 1024 * 1024);
    const str = input.toString().trim().toLowerCase();
    if (!str || str === '0' || str === 'unlimited' || str === 'no limit') return 0;
    
    if (str.endsWith('gb') || str.endsWith('g')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : Math.round(num * 1024 * 1024 * 1024);
    }
    if (str.endsWith('mb') || str.endsWith('m')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : Math.round(num * 1024 * 1024);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num * 1024 * 1024);
};

const createContainer = async ({ name, image, ports, env, volumes, restartPolicy, memoryLimit, autoStart = true }) => {
    if (!docker) throw new Error('Docker not available');

    // pull image if not locally present
    try {
        await docker.getImage(image).inspect();
    } catch (e) {
        const stream = await docker.pull(image);
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });
    }

    const ExposedPorts = {};
    const PortBindings = {};
    if (ports && typeof ports === 'string') {
        const portList = ports.split(',').map(p => p.trim()).filter(Boolean);
        for (const p of portList) {
            const parts = p.split(':');
            if (parts.length === 2) {
                const [hostPort, containerPort] = parts;
                const portKey = `${containerPort}/tcp`;
                ExposedPorts[portKey] = {};
                PortBindings[portKey] = [{ HostPort: hostPort }];
            }
        }
    }

    let Env = [];
    if (Array.isArray(env)) {
        Env = env;
    } else if (typeof env === 'string') {
        Env = env.split('\n').map(e => e.trim()).filter(Boolean);
    }

    let Binds = [];
    if (Array.isArray(volumes)) {
        Binds = volumes;
    } else if (typeof volumes === 'string') {
        Binds = volumes.split('\n').map(v => v.trim()).filter(Boolean);
    }

    const RestartPolicy = restartPolicy ? { Name: restartPolicy } : { Name: 'unless-stopped' };

    const HostConfig = {
        PortBindings,
        Binds,
        RestartPolicy
    };

    const memoryBytes = parseMemoryLimit(memoryLimit);
    if (memoryBytes > 0) {
        HostConfig.Memory = memoryBytes;
        HostConfig.MemorySwap = memoryBytes;
    }

    const container = await docker.createContainer({
        name: name || undefined,
        Image: image,
        ExposedPorts,
        Env,
        HostConfig
    });

    if (autoStart) {
        await container.start();
    }

    return { id: container.id.slice(0, 12) };
};

const getAllImages = async () => {
    if (!docker) throw new Error('Docker not available');

    try {
        const images = await docker.listImages();
        return images.map(img => {
            const repoTags = img.RepoTags || ['<none>:<none>'];
            const sizeMb = Math.round((img.Size / (1024 * 1024)) * 10) / 10;
            return {
                id: img.Id.replace('sha256:', '').slice(0, 12),
                fullId: img.Id,
                tags: repoTags,
                primaryTag: repoTags[0] !== '<none>:<none>' ? repoTags[0] : (img.RepoDigests?.[0]?.split('@')[0] || img.Id.slice(7, 19)),
                size: sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(2)} GB` : `${sizeMb} MB`,
                created: img.Created
            };
        });
    } catch (error) {
        throw new Error('Failed to fetch images: ' + error.message);
    }
};

const getImage = async (id) => {
    if (!docker) throw new Error('Docker not available');

    try {
        const image = docker.getImage(id);
        const info = await image.inspect();
        const sizeMb = Math.round((info.Size / (1024 * 1024)) * 10) / 10;
        return {
            id: info.Id.replace('sha256:', '').slice(0, 12),
            fullId: info.Id,
            tags: info.RepoTags || [],
            size: sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(2)} GB` : `${sizeMb} MB`,
            os: info.Os || 'linux',
            architecture: info.Architecture || 'amd64',
            author: info.Author || '-',
            created: info.Created,
            dockerVersion: info.DockerVersion || '-',
            cmd: info.Config?.Cmd?.join(' ') || '-',
            entrypoint: info.Config?.Entrypoint?.join(' ') || '-',
            env: (info.Config?.Env || []).filter(e => !e.startsWith('PATH=')),
            exposedPorts: Object.keys(info.Config?.ExposedPorts || {})
        };
    } catch (error) {
        throw new Error('Failed to inspect image: ' + error.message);
    }
};

const pullImage = async (imageName) => {
    if (!docker) throw new Error('Docker not available');
    if (!imageName || typeof imageName !== 'string') {
        throw new Error('Image name is required');
    }

    const trimmed = imageName.trim();
    const fullImage = trimmed.includes(':') ? trimmed : `${trimmed}:latest`;

    try {
        const stream = await docker.pull(fullImage);
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
        return { success: true, image: fullImage };
    } catch (error) {
        throw new Error('Failed to pull image: ' + error.message);
    }
};

const tagImage = async (id, repo, tag = 'latest') => {
    if (!docker) throw new Error('Docker not available');
    if (!repo || typeof repo !== 'string') {
        throw new Error('Target repository is required');
    }

    try {
        const image = docker.getImage(id);
        const targetTag = (tag && tag.trim()) ? tag.trim() : 'latest';
        await image.tag({ repo: repo.trim(), tag: targetTag });
        return { success: true, repo: repo.trim(), tag: targetTag };
    } catch (error) {
        throw new Error('Failed to tag image: ' + error.message);
    }
};

const buildImage = async ({ contextPath, imageName, tag = 'latest', dockerfile = 'Dockerfile' }) => {
    if (!docker) throw new Error('Docker not available');
    if (!contextPath || typeof contextPath !== 'string') {
        throw new Error('Source context directory is required');
    }
    if (!imageName || typeof imageName !== 'string') {
        throw new Error('Image name is required');
    }

    const resolvedPath = path.resolve(contextPath.trim());
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Source directory "${contextPath}" does not exist on host`);
    }

    const dockerfileName = (dockerfile && dockerfile.trim()) ? dockerfile.trim() : 'Dockerfile';
    const dockerfilePath = path.join(resolvedPath, dockerfileName);
    if (!fs.existsSync(dockerfilePath)) {
        throw new Error(`Dockerfile "${dockerfileName}" not found in source directory`);
    }

    const targetTag = (tag && tag.trim()) ? tag.trim() : 'latest';
    const fullImageTag = `${imageName.trim()}:${targetTag}`;
    const tarStream = tar.pack(resolvedPath);

    try {
        const stream = await docker.buildImage(tarStream, {
            t: fullImageTag,
            dockerfile: dockerfileName
        });

        const buildLogs = [];
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(
                stream,
                (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                },
                (event) => {
                    if (event.stream) {
                        buildLogs.push(event.stream);
                    } else if (event.error) {
                        buildLogs.push(`ERROR: ${event.error}`);
                    }
                }
            );
        });

        return {
            success: true,
            image: fullImageTag,
            logs: buildLogs.join('').trim()
        };
    } catch (error) {
        throw new Error('Failed to build image: ' + error.message);
    }
};

const deleteImage = async (id, force = true) => {
    if (!docker) throw new Error('Docker not available');

    try {
        const image = docker.getImage(id);
        await image.remove({ force });
        return { success: true };
    } catch (error) {
        throw new Error('Failed to delete image: ' + error.message);
    }
};

module.exports = {
    getAllContainers,
    getContainer,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    createContainer,
    updateContainer,
    getAllImages,
    getImage,
    pullImage,
    tagImage,
    buildImage,
    deleteImage,
    getLogs,
    getStats,
    getSystemInfo
};
