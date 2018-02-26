public static void Run(Stream geojsonBlob, string name, TraceWriter log)
{
    log.Info($"C# Blob trigger function Processed blob\n Name:{name} \n Size: {geojsonBlob.Length} Bytes");
}
